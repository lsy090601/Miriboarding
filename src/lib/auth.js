const AUTH_STORAGE_KEY = 'miriboarding_auth'

export const MOCK_STUDENT_ID = '99999999-9999-9999-9999-999999999999'

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
