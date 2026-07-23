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
