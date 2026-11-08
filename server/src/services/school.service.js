// 교육부 NEIS(나이스) 교육정보 개방 포털 "학교기본정보" OpenAPI 연동.
// 회원가입 학교 선택(자동완성)용으로, 학교명 일부로 검색해서 목록을 돌려준다.
//
//  - 문서: https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN17020190531110010104913&infSeq=2
//  - 인증키(NEIS_API_KEY)는 서버에서만 쓴다. 브라우저에는 노출하지 않는다.
//  - 키가 없어도 호출은 되지만 NEIS 정책상 5건만 샘플로 내려온다. (개발/테스트용)
//  - 응답 정상: { schoolInfo: [ { head: [...] }, { row: [...] } ] }
//    결과 없음/오류: { RESULT: { CODE: 'INFO-200' | 'INFO-300' | 'ERROR-...', MESSAGE } }

const NEIS_SCHOOL_URL = 'https://open.neis.go.kr/hub/schoolInfo'
const PAGE_SIZE = 10

export class SchoolApiError extends Error {}

export async function searchSchools(query) {
  const name = typeof query === 'string' ? query.trim() : ''
  if (name.length < 2) return []

  const params = new URLSearchParams({ Type: 'json', pIndex: '1', pSize: String(PAGE_SIZE), SCHUL_NM: name })
  const key = process.env.NEIS_API_KEY
  if (key) params.set('KEY', key)

  let data
  try {
    const res = await fetch(`${NEIS_SCHOOL_URL}?${params}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new SchoolApiError(`NEIS 응답 오류 (${res.status})`)
    data = await res.json()
  } catch (error) {
    if (error instanceof SchoolApiError) throw error
    throw new SchoolApiError('학교 정보 서비스에 연결하지 못했습니다.')
  }

  const result = data?.RESULT
  if (result) {
    // INFO-200: 해당하는 데이터가 없습니다. → 빈 목록
    if (result.CODE === 'INFO-200') return []
    console.error('[school] NEIS 오류 응답:', result.CODE, result.MESSAGE)
    throw new SchoolApiError('학교 정보 서비스 오류가 발생했습니다.')
  }

  const rows = data?.schoolInfo?.find((block) => Array.isArray(block.row))?.row ?? []
  return rows.map((row) => ({
    code: row.SD_SCHUL_CODE,
    name: row.SCHUL_NM,
    type: row.SCHUL_KND_SC_NM ?? '',
    region: row.ATPT_OFCDC_SC_NM ?? '',
    address: row.ORG_RDNMA ?? '',
  }))
}
