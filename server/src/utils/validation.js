export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPassword(password, minLength = 8) {
  return typeof password === 'string' && password.length >= minLength
}

export function isValidBusinessNumber(businessNumber) {
  if (typeof businessNumber !== 'string') return false
  return normalizeBusinessNumber(businessNumber).length === 10
}

export function normalizeBusinessNumber(businessNumber) {
  return businessNumber.replace(/\D/g, '')
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}
