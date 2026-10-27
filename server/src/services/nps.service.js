const { NPS_SERVICE_KEY } = process.env
const NPS_BASE_URL = 'https://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2'

// 국민연금공단 "국민연금 가입 사업장 내역"(V2) OpenAPI 연동.
// 요청/응답 필드는 공식 활용가이드(v2.0) 기준이다.
//
// 흐름
//  1) getBassInfoSearchV2 : 사업자등록번호 "앞 6자리"(+ 선택적으로 사업장명)로 검색 → 식별번호(seq) 목록
//  2) getDetailInfoSearchV2 : seq로 상세 조회 → 사업장명(wkplNm), 업종명(vldtVlKrnNm), 등록일(adptDt)
//
// 한계 (API 자체의 제약)
//  - 사업자등록번호는 공개 데이터라 "앞 6자리"만 검색에 쓰이고 응답도 124815**** 처럼 가려진다.
//    그래서 번호만으로는 한 회사로 좁혀지지 않는 경우가 많다. 사업장명을 같이 주면 거의 한 건으로 좁혀진다.
//  - 3인 이상 법인사업장만 제공된다. 개인사업자/작은 회사는 조회되지 않는다.
//  - adptDt는 실제 "설립일"이 아니라 국민연금 사업장 등록일이다.
//
// 키가 없거나 호출 실패, 또는 결과가 0건/여러 곳이라 한 회사로 못 좁히면 null을 반환해서
// auth.service.js가 기존 mock으로 폴백한다. (절대 throw하지 않는다)

function toItemList(data) {
  const items = data?.response?.body?.items?.item
  if (Array.isArray(items)) return items
  return items ? [items] : []
}

async function callNps(operation, params) {
  const query = new URLSearchParams({ serviceKey: NPS_SERVICE_KEY, dataType: 'json', ...params })
  const res = await fetch(`${NPS_BASE_URL}/${operation}?${query}`)
  if (!res.ok) {
    console.error(`[nps] ${operation} 호출 실패:`, res.status)
    return null
  }
  const data = await res.json()
  const code = data?.response?.header?.resultCode
  if (code && code !== '00') {
    console.error(`[nps] ${operation} 오류 응답:`, code, data?.response?.header?.resultMsg)
    return null
  }
  return data
}

export async function lookupNpsCompany(businessNumber, companyName) {
  if (!NPS_SERVICE_KEY) return null

  const digits = String(businessNumber ?? '').replace(/\D/g, '')
  if (digits.length !== 10) return null

  try {
    const searchParams = { bzowrRgstNo: digits.slice(0, 6), pageNo: '1', numOfRows: '100' }
    if (typeof companyName === 'string' && companyName.trim()) {
      searchParams.wkplNm = companyName.trim()
    }

    const searchData = await callNps('getBassInfoSearchV2', searchParams)
    if (!searchData) return null

    // 등록 상태(1)인 사업장만, 같은 사업장이 월별로 여러 번 나올 수 있어 이름+번호+주소로 묶는다.
    const registered = toItemList(searchData).filter((item) => String(item.wkplJnngStcd) === '1')
    const bySite = new Map()
    for (const item of registered) {
      const key = `${item.wkplNm}|${item.bzowrRgstNo}|${item.wkplRoadNmDtlAddr}`
      const prev = bySite.get(key)
      if (!prev || Number(item.seq) > Number(prev.seq)) bySite.set(key, item)
    }

    if (bySite.size !== 1) {
      console.error('[nps] 한 회사로 좁혀지지 않아 폴백. 후보 수:', bySite.size)
      return null
    }
    const [{ seq }] = bySite.values()

    const detailData = await callNps('getDetailInfoSearchV2', { seq: String(seq), pageNo: '1', numOfRows: '1' })
    if (!detailData) return null

    const detail = toItemList(detailData)[0]
    if (!detail?.wkplNm) {
      console.error('[nps] 상세 응답에 wkplNm 없음:', JSON.stringify(detailData).slice(0, 300))
      return null
    }

    return {
      company_name: detail.wkplNm,
      industry: detail.vldtVlKrnNm || '',
      founded_date: formatNpsDate(detail.adptDt),
    }
  } catch (error) {
    console.error('[nps] 호출 중 오류:', error)
    return null
  }
}

function formatNpsDate(yyyymmdd) {
  const s = String(yyyymmdd ?? '')
  if (s.length !== 8 || s === '00010101') return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}
