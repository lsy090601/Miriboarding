export const dashboardMock = {
  companyName: "OO물류",
  registeredStudents: 5,
  missionCompletionRate: 68,
  activeOnboardings: 2,
};

export const studentListMock = [
  {
    id: 1,
    name: "양정원",
    email: "jeongwon@school.ac.kr",
    progress: 68,
    missions: "1/3",
    lastAccess: "오늘 14:30",
    completedMissions: [{ id: "m1", title: "회사 소개 자료 읽고 요약하기" }],
    incompletedMissions: [
      { id: "m2", title: "용어 정리 퀴즈 제출" },
      { id: "m3", title: "첫 출근 준비물 체크리스트" },
    ],
  },
  {
    id: 2,
    name: "이준호",
    email: "junho@school.ac.kr",
    progress: 45,
    missions: "0/3",
    lastAccess: "어제 16:20",
    completedMissions: [],
    incompletedMissions: [
      { id: "m1", title: "회사 소개 자료 읽고 요약하기" },
      { id: "m2", title: "용어 정리 퀴즈 제출" },
      { id: "m3", title: "첫 출근 준비물 체크리스트" },
    ],
  },
  {
    id: 3,
    name: "박서연",
    email: "seoyeon@school.ac.kr",
    progress: 100,
    missions: "3/3",
    lastAccess: "2일 전",
    completedMissions: [
      { id: "m1", title: "회사 소개 자료 읽고 요약하기" },
      { id: "m2", title: "용어 정리 퀴즈 제출" },
      { id: "m3", title: "첫 출근 준비물 체크리스트" },
    ],
    incompletedMissions: [],
  },
];

export function getStudentById(studentId) {
  return studentListMock.find(
    (student) => String(student.id) === String(studentId),
  );
}

export const onboardingListMock = [
  {
    companyId: "oo-logistics",
    jobTitle: "물류관리사",
    status: "진행 중",
    enrolledCount: 3,
  },
  {
    companyId: "oo-finance",
    jobTitle: "금융시스템 운영",
    status: "작성 중",
    enrolledCount: 0,
  },
];
export const onboardingDetailMock = {
  "oo-logistics": {
    jobTitle: "물류관리사",
    companyName: "OO물류",
    schedules: {
      day: [
        {
          id: "d1",
          time: "10:00~11:00",
          activity: "팀 스탠드업 미팅",
          importance: "medium",
          terms: "스탠드업",
        },
        {
          id: "d2",
          time: "11:00~13:00",
          activity: "입출고 처리",
          importance: "high",
          terms: "피킹, 입출고",
        },
      ],
      week: [
        {
          id: "w1",
          day: "월요일",
          activity: "재고 실사",
          importance: "medium",
          terms: "재고실사",
        },
        {
          id: "w2",
          day: "화요일",
          activity: "WMS 시스템 교육",
          importance: "high",
          terms: "WMS",
        },
      ],
      month: [
        {
          id: "m1",
          day: "1일차",
          activity: "물류 프로세스 이해",
          importance: "medium",
          terms: "공급망",
        },
      ],
    },
    missions: [
      {
        id: "ms1",
        title: "회사 소개 자료 읽고 요약하기",
        description: "회사 소개 PPT를 읽고 핵심만 정리해요",
        submissionType: "text",
      },
      {
        id: "ms2",
        title: "창고 배치도 확인 퀴즈",
        description: "배치도를 보고 5문제를 풀어요",
        submissionType: "choice",
      },
    ],
  },
};

export function getOnboardingDetail(companyId) {
  return onboardingDetailMock[companyId] ?? null;
}

export const JOB_OPTIONS = [
  "백엔드 개발",
  "프론트엔드 개발",
  "물류관리",
  "데이터 분석",
  "금융시스템 운영",
];
