import { AuthError, validateBusiness, signupStudent, signupCompany, login, getCompanyProfile } from '../services/auth.service.js'
import { isNonEmptyString } from '../utils/validation.js'

function handleError(res, error) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  console.error(error)
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' })
}

export function validateBusinessHandler(req, res) {
  const { businessNumber } = req.body
  if (!isNonEmptyString(businessNumber)) {
    return res.status(400).json({ valid: false, message: '사업자등록번호를 입력해주세요.' })
  }
  return res.status(200).json(validateBusiness(businessNumber))
}

export async function signupStudentHandler(req, res) {
  try {
    const { user_id } = await signupStudent(req.body)
    return res.status(201).json({ success: true, user_id })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function signupCompanyHandler(req, res) {
  try {
    const { company_id } = await signupCompany(req.body)
    return res.status(201).json({ success: true, company_id })
  } catch (error) {
    return handleError(res, error)
  }
}

export async function getCompanyProfileHandler(req, res) {
  try {
    const result = await getCompanyProfile(req.params.companyId)
    return res.status(200).json(result)
  } catch (error) {
    return handleError(res, error)
  }
}

export async function loginHandler(req, res) {
  try {
    const result = await login(req.body)
    return res.status(200).json({ success: true, ...result })
  } catch (error) {
    return handleError(res, error)
  }
}
