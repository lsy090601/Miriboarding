export function isRequired(value) {
  return value.trim().length > 0
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidPassword(value, minLength = 8) {
  return value.length >= minLength
}

export function doPasswordsMatch(password, confirmPassword) {
  return password.length > 0 && password === confirmPassword
}

export function isValidBizNumber(value) {
  return /^\d{3}-\d{2}-\d{5}$/.test(value.trim())
}

export function isValidPhone(value) {
  return /^\d{2,3}-\d{3,4}-\d{4}$/.test(value.trim())
}

export function getPasswordStrength(password) {
  if (!password) return 'weak'
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (score <= 2) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
}
