// 업종을 우선하고, 담당자가 입력한 사업 내용으로 추천 범위를 보완한다.
const JOB_GROUPS = [
  { pattern: /소프트웨어|정보통신|프로그래밍|시스템.*개발|IT\b|플랫폼|앱 개발|웹 개발/i, jobs: ['백엔드 개발', '프론트엔드 개발', '앱 개발', '소프트웨어 QA', '서비스 기획', '데이터 분석', '인프라 운영', '정보보안'] },
  { pattern: /제조|생산|전자|반도체|기계|영상 기기|전기장비/, jobs: ['생산관리', '품질관리', '생산기술', '설비 유지보수', '제품 연구개발', '구매·자재관리', '안전관리', '기술영업'] },
  { pattern: /물류|운송|운수|창고|배송|택배/, jobs: ['물류 운영', '입출고·재고관리', '운송·배차관리', '물류 데이터 분석', '구매·조달', '무역사무'] },
  { pattern: /금융|은행|보험|증권|투자|핀테크/, jobs: ['금융사무', '고객상담', '리스크 관리', '금융 데이터 분석', '금융시스템 운영', '준법지원'] },
  { pattern: /도매|소매|도소매|유통|쇼핑몰|전자상거래|이커머스|판매/, jobs: ['상품기획·MD', '온라인몰 운영', '영업관리', '디지털 마케팅', '고객상담', '주문·재고관리', '구매관리'] },
  { pattern: /건설|건축|토목|인테리어|공사/, jobs: ['건축설계', '시공관리', '공무·견적', '현장 안전관리', '자재관리', '품질관리'] },
  { pattern: /병원|의료|보건|요양|헬스케어/, jobs: ['원무행정', '의료정보 관리', '고객상담', '의료기기 관리', '경영지원'] },
  { pattern: /교육|학원|학교|에듀테크|학습/, jobs: ['교육 운영', '교육 콘텐츠 기획', '학사행정', '학습상담', '교육 마케팅'] },
  { pattern: /광고|디자인|콘텐츠|방송|출판|영상 제작|미디어/, jobs: ['콘텐츠 기획', '시각디자인', '영상 제작·편집', '광고 운영', '디지털 마케팅', '프로젝트 운영'] },
  { pattern: /음식|식품|외식|식당|호텔|숙박|관광|여행/, jobs: ['매장·서비스 운영', '고객응대', '예약관리', '식음료 운영', '위생·품질관리', '상품기획'] },
];

export function getCompanyJobRecommendations(industry = '', description = '') {
  const primary = JOB_GROUPS.filter(({ pattern }) => pattern.test(industry));
  const additional = JOB_GROUPS.filter(({ pattern }) => pattern.test(description));
  const matched = primary.length > 0 || additional.length > 0;
  const jobs = [...new Set([
    ...primary.flatMap(({ jobs }) => jobs),
    ...additional.flatMap(({ jobs }) => jobs),
    '경영지원', '회계·재무', '인사·총무', '영업·고객관리',
  ])];
  return { jobs, matched };
}
