const AUTH_STORAGE_KEY = 'miriboarding_auth'

// 실제 Supabase에 회원가입돼 있는 데모용 학생/회사 계정 (테스트용으로 직접 생성함)
export const MOCK_STUDENT_ID = '46fb596d-af5d-49a0-9712-beca14a7622a'
export const DEMO_COMPANY_ID = 'dc715ff2-b696-4f1f-a998-5940e715257d'

export function getStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

// 로그인된 계정이 학생일 때만 그 id를 쓰고, 아니면(회사 로그인/비로그인) 데모 학생 id로 폴백한다.
// 회사 계정으로 로그인된 상태에서 학생 페이지에 들어오면 userId가 companies.id를 가리켜서
// student_enrollment의 외래키 제약을 위반하는 문제가 있었음.
export function getCurrentStudentId() {
  const auth = getStoredAuth()
  if (auth?.userType === 'student' && auth.userId) return auth.userId
  return MOCK_STUDENT_ID
}
