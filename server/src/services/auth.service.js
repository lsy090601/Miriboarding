import { supabaseAuth, supabaseAdmin } from '../config/supabase.js'
import { isValidEmail, isValidPassword, isValidBusinessNumber, isNonEmptyString, normalizeBusinessNumber } from '../utils/validation.js'
import { lookupMockCompany } from '../utils/mockBusinessRegistry.js'

export class AuthError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

function requireEmailAndPassword(email, password) {
  if (!isValidEmail(email)) throw new AuthError(400, 'INVALID_EMAIL', '이메일 형식이 올바르지 않습니다.')
  if (!isValidPassword(password)) throw new AuthError(400, 'INVALID_PASSWORD', '비밀번호는 8자 이상이어야 합니다.')
}

async function assertEmailNotTaken(email) {
  const { data, error } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()
  if (error) {
    throw new AuthError(502, 'SUPABASE_ERROR', '이메일 중복 확인 중 오류가 발생했습니다.')
  }
  if (data) {
    throw new AuthError(409, 'EMAIL_TAKEN', '이미 가입된 이메일입니다.')
  }
}

async function createAuthUser(email, password) {
  const { data, error } = await supabaseAuth.auth.signUp({ email, password })
  if (error) {
    if (/registered/i.test(error.message ?? '')) {
      throw new AuthError(409, 'EMAIL_TAKEN', '이미 가입된 이메일입니다.')
    }
    throw new AuthError(502, 'SUPABASE_ERROR', 'Supabase 인증 계정 생성 중 오류가 발생했습니다.')
  }
  if (!data?.user) {
    throw new AuthError(502, 'SUPABASE_ERROR', 'Supabase 인증 계정 생성 중 오류가 발생했습니다.')
  }
  return data.user
}

// authUser 생성 이후 단계(users/students/companies insert)에서 실패하면
// auth 계정뿐 아니라 이미 insert된 public.users 행도 같이 지워야 한다.
// public.users는 auth.users에 대한 FK cascade가 없어서, 이걸 안 지우면
// 그 이메일로는 영영 재가입이 안 되는 좀비 행이 남는다.
async function rollbackSignup(userId) {
  await supabaseAdmin.from('users').delete().eq('id', userId).then(() => {}, () => {})
  await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {})
}

export function validateBusiness(businessNumber) {
  if (!isValidBusinessNumber(businessNumber)) {
    return { valid: false }
  }
  const company = lookupMockCompany(businessNumber)
  return { valid: true, ...company }
}

export async function signupStudent({ email, password, name, school, age }) {
  requireEmailAndPassword(email, password)
  if (!isNonEmptyString(name) || !isNonEmptyString(school) || !Number.isInteger(age) || age <= 0) {
    throw new AuthError(400, 'INVALID_INPUT', '이름, 학교, 나이를 모두 입력해주세요.')
  }

  await assertEmailNotTaken(email)
  const authUser = await createAuthUser(email, password)

  const { error: usersError } = await supabaseAdmin.from('users').insert({
    id: authUser.id,
    email,
    user_type: 'student',
  })
  if (usersError) {
    console.error('users insert 실패(student):', usersError)
    await rollbackSignup(authUser.id)
    throw new AuthError(502, 'SUPABASE_ERROR', '사용자 정보 저장 중 오류가 발생했습니다.')
  }

  const { error: studentsError } = await supabaseAdmin.from('students').insert({
    id: authUser.id,
    name,
    school,
    age,
  })
  if (studentsError) {
    console.error('students insert 실패:', studentsError)
    await rollbackSignup(authUser.id)
    throw new AuthError(502, 'SUPABASE_ERROR', '학생 정보 저장 중 오류가 발생했습니다.')
  }

  return { user_id: authUser.id }
}

export async function signupCompany({
  email,
  password,
  businessNumber,
  company_name,
  industry,
  founded_date,
  contact_name,
  contact_position,
  contact_phone,
}) {
  requireEmailAndPassword(email, password)
  if (!isValidBusinessNumber(businessNumber)) {
    throw new AuthError(400, 'INVALID_BUSINESS_NUMBER', '사업자등록번호 형식이 올바르지 않습니다.')
  }
  if (
    !isNonEmptyString(company_name) ||
    !isNonEmptyString(industry) ||
    !isNonEmptyString(founded_date) ||
    !isNonEmptyString(contact_name) ||
    !isNonEmptyString(contact_position)
  ) {
    throw new AuthError(400, 'INVALID_INPUT', '회사 정보를 모두 입력해주세요.')
  }

  await assertEmailNotTaken(email)
  const authUser = await createAuthUser(email, password)

  const { error: usersError } = await supabaseAdmin.from('users').insert({
    id: authUser.id,
    email,
    user_type: 'company',
  })
  if (usersError) {
    console.error('users insert 실패(company):', usersError)
    await rollbackSignup(authUser.id)
    throw new AuthError(502, 'SUPABASE_ERROR', '사용자 정보 저장 중 오류가 발생했습니다.')
  }

  const { error: companiesError } = await supabaseAdmin.from('companies').insert({
    id: authUser.id,
    business_number: normalizeBusinessNumber(businessNumber),
    company_name,
    industry,
    founded_date,
    contact_name,
    contact_position,
    contact_phone: isNonEmptyString(contact_phone) ? contact_phone : null,
  })
  if (companiesError) {
    await rollbackSignup(authUser.id)
    if (companiesError.code === '23505' && /business_number/.test(companiesError.message ?? '')) {
      throw new AuthError(409, 'BUSINESS_NUMBER_TAKEN', '이미 가입된 사업자등록번호입니다.')
    }
    console.error('companies insert 실패:', companiesError)
    throw new AuthError(502, 'SUPABASE_ERROR', '회사 정보 저장 중 오류가 발생했습니다.')
  }

  return { company_id: authUser.id }
}

export async function login({ email, password }) {
  if (!isValidEmail(email)) throw new AuthError(400, 'INVALID_EMAIL', '이메일 형식이 올바르지 않습니다.')
  if (!isNonEmptyString(password)) throw new AuthError(400, 'INVALID_PASSWORD', '비밀번호를 입력해주세요.')

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.status === 400) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
    }
    throw new AuthError(502, 'SUPABASE_ERROR', 'Supabase 로그인 처리 중 오류가 발생했습니다.')
  }

  const { data: userRow, error: userRowError } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', data.user.id)
    .single()
  if (userRowError) {
    throw new AuthError(502, 'SUPABASE_ERROR', '사용자 정보 조회 중 오류가 발생했습니다.')
  }

  return {
    user_type: userRow.user_type,
    user_id: data.user.id,
    access_token: data.session.access_token,
  }
}
