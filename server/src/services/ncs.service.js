const { NCS_SERVICE_KEY, NCS_API_BASE_URL } = process.env

// NCS 공공데이터포털 Open API 연동. 정확한 요청 파라미터명/응답 필드명은
// 실제 서비스키를 받아 한 번 호출해본 뒤 확정 예정 (data.go.kr가 Swagger UI라
// 미리 확인 불가했음). 키가 없거나 호출이 실패하면 null을 반환해서
// gemini.service.js의 generateJobSchedulePlan이 NCS 자료 없이(LLM 지식만으로)
// 생성하도록 자연스럽게 폴백한다.
export async function getNcsContentForJob(jobTitle) {
  if (!NCS_SERVICE_KEY || !NCS_API_BASE_URL) {
    return null
  }

  try {
    const url = `${NCS_API_BASE_URL}?ServiceKey=${encodeURIComponent(NCS_SERVICE_KEY)}&keyword=${encodeURIComponent(jobTitle)}&numOfRows=20&pageNo=1&resultType=json`
    const res = await fetch(url)
    if (!res.ok) {
      console.error('[ncs] API 호출 실패:', res.status)
      return null
    }
    const data = await res.json()
    // TODO: 실제 응답 구조 확인 후 능력단위명 + 능력단위요소 설명을 하나의
    // 텍스트로 합쳐서 반환하도록 파싱 로직 확정
    console.error('[ncs] 응답 파싱 미구현, 원본 응답:', JSON.stringify(data).slice(0, 500))
    return null
  } catch (error) {
    console.error('[ncs] 호출 중 오류:', error)
    return null
  }
}
