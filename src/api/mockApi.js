import { isValidBizNumber } from '../utils/validation.js'

const TAKEN_EMAILS = new Set(['test@example.com', 'admin@miriboarding.com'])
const UNAVAILABLE_BIZ_NUMBERS = new Set(['000-00-00000'])

export function checkEmailExists(email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ exists: TAKEN_EMAILS.has(email.trim().toLowerCase()) })
    }, 400)
  })
}

export function verifyBusinessNumber(bizNumber) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const value = bizNumber.trim()
      if (!isValidBizNumber(value)) {
        resolve({ status: 'invalid' })
        return
      }
      if (UNAVAILABLE_BIZ_NUMBERS.has(value)) {
        resolve({ status: 'unavailable' })
        return
      }
      resolve({
        status: 'verified',
        company: {
          companyName: '미리보딩(주)',
          industry: 'IT/소프트웨어',
          foundedAt: '2021-03-15',
        },
      })
    }, 600)
  })
}
