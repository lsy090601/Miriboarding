import { isValidBizNumber } from '../utils/validation.js'

export function verifyBusinessNumber(bizNumber) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isValidBizNumber(bizNumber)) {
        resolve({ verified: true })
      } else {
        reject(new Error('사업자 번호 형식을 확인해주세요. (예: 123-45-67890)'))
      }
    }, 500)
  })
}
