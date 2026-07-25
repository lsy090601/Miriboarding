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

export function setDemoStudentSession() {
  setStoredAuth({ userId: MOCK_STUDENT_ID, userType: 'student', isDemo: true })
}
