import { DEMO_COMPANY_ID } from '../lib/auth.js'

export const IMPORTANCE_LABEL = {
  low: '낮음',
  medium: '중간',
  high: '높음',
}

export const SUBMISSION_TYPE_LABEL = {
  file: '파일 제출',
  text: '텍스트 작성',
  choice: '선택지 응답',
}

export const onboardings = {
  [DEMO_COMPANY_ID]: {
    companyId: DEMO_COMPANY_ID,
    companyName: 'OO물류',
    jobTitle: '물류관리사',
    targetDate: '2026-09-07',
    schedules: {
      day: [
        {
          id: 'oo-logistics-day-1',
          period: 'day',
          title: '입고 물품 검수 (OO물류 방식)',
          importance: 'high',
          description:
            'OO물류에서는 입고 물품을 스캐너로 먼저 스캔한 뒤, 담당자가 육안으로 파손 여부를 한 번 더 확인해요. 이 두 단계를 모두 거쳐야 입고 처리가 완료돼요.',
        },
        {
          id: 'oo-logistics-day-2',
          period: 'day',
          title: '오후 출고 마감 체크',
          importance: 'medium',
          description:
            'OO물류는 매일 오후 3시에 그날 출고 건을 마감해요. 마감 전까지 들어온 주문만 당일 출고로 처리돼요.',
        },
        {
          id: 'oo-logistics-day-3',
          period: 'day',
          title: '재고 시스템(WMS) 마감 입력',
          importance: 'medium',
          description:
            '하루 업무를 마치기 전, OO물류 자체 WMS 시스템에 그날의 입출고 수량을 최종 입력하고 담당자 확인을 받아요.',
        },
      ],
      week: [
        {
          id: 'oo-logistics-week-1',
          period: 'week',
          title: '주간 발주 회의 참석',
          importance: 'medium',
          description:
            'OO물류는 매주 월요일 오전에 발주 회의를 진행해요. 지난 주 판매량을 바탕으로 이번 주 발주 물량을 함께 정해요.',
        },
        {
          id: 'oo-logistics-week-2',
          period: 'week',
          title: '거래처별 출고 스케줄 조정',
          importance: 'high',
          description:
            'OO물류의 주요 거래처마다 원하는 출고 시간대가 달라요. 이번 주 출고 스케줄을 거래처별로 미리 조정해두는 작업이에요.',
        },
        {
          id: 'oo-logistics-week-3',
          period: 'week',
          title: '주간 재고 마감 보고',
          importance: 'medium',
          description:
            '금요일에는 한 주간의 재고 변동을 정리해서 팀장님께 간단히 보고하는 시간을 가져요.',
        },
      ],
      month: [
        {
          id: 'oo-logistics-month-1',
          period: 'month',
          title: '1주차: OO물류 시스템 적응',
          importance: 'medium',
          description: 'OO물류에서 사용하는 WMS와 사내 발주 규칙에 익숙해지는 기간이에요.',
        },
        {
          id: 'oo-logistics-month-2',
          period: 'month',
          title: '2~3주차: 거래처 업무 실습',
          importance: 'high',
          description: '주요 거래처별 출고 규칙을 익히고, 실제 출고 스케줄 조정을 직접 해보는 기간이에요.',
        },
        {
          id: 'oo-logistics-month-3',
          period: 'month',
          title: '4주차: 월간 마감 프로세스 실습',
          importance: 'medium',
          description: '한 달간 배운 내용을 바탕으로 월간 재고 마감 프로세스를 처음부터 끝까지 실습해봐요.',
        },
      ],
    },
    missions: [
      {
        id: 'mission-1',
        title: 'OO물류 소개자료 읽고 요약하기',
        description:
          'OO물류에서 제공한 회사 소개 자료를 읽고, 회사가 어떤 사업을 하는지와 우리 팀이 맡은 역할을 3~5문장으로 요약해서 제출해주세요.',
        submissionType: 'text',
        completed: true,
      },
      {
        id: 'mission-2',
        title: '입출고 프로세스 이해도 체크',
        description:
          '이번 주 학습한 OO물류의 입출고 프로세스에 대한 간단한 이해도 확인 문제예요. 가장 알맞은 답을 선택해주세요.',
        submissionType: 'choice',
        options: [
          '입고 물품은 스캔만 하면 바로 처리된다',
          '입고 물품은 스캔 후 담당자 육안 확인까지 거쳐야 처리된다',
          '입고 물품은 담당자 육안 확인만으로 처리된다',
        ],
        completed: false,
      },
      {
        id: 'mission-3',
        title: '물류센터 안전수칙 서약서 제출',
        description:
          'OO물류 물류센터 출입 전 안전수칙 서약서를 다운로드해서 작성한 뒤, 스캔본이나 사진 파일로 제출해주세요.',
        submissionType: 'file',
        completed: false,
      },
    ],
  },
}

export function getOnboardingByCompanyId(companyId) {
  return onboardings[companyId]
}

export function getDDay(targetDate) {
  const today = new Date()
  const target = new Date(targetDate)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function getMissionProgress(missions) {
  const completed = missions.filter((mission) => mission.completed).length
  return { completed, total: missions.length }
}
