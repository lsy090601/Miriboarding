import { normalizeBusinessNumber } from './validation.js'

const INDUSTRIES = ['IT/소프트웨어', '제조업', '도소매업', '서비스업', '건설업']

// 실제 국세청 API 연동 전까지 사용하는 mock 조회 — 형식이 맞으면 입력값 기반으로
// 그럴듯한 임의 회사 정보를 만들어 돌려준다.
export function lookupMockCompany(businessNumber) {
  const digits = normalizeBusinessNumber(businessNumber)
  const seed = Number(digits.slice(-3)) || 0

  const industry = INDUSTRIES[seed % INDUSTRIES.length]
  const year = 2000 + (seed % 24)
  const month = String((seed % 12) + 1).padStart(2, '0')
  const day = String((seed % 27) + 1).padStart(2, '0')

  return {
    company_name: `미리보딩(주) ${digits.slice(0, 3)}`,
    industry,
    founded_date: `${year}-${month}-${day}`,
  }
}
