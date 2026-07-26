const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? 'UNKNOWN_ERROR', data?.message ?? '요청 처리 중 오류가 발생했습니다.')
  }

  return data
}

export function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function validateBusiness(businessNumber) {
  return apiFetch('/api/auth/validate-business', {
    method: 'POST',
    body: JSON.stringify({ businessNumber }),
  })
}

export function signupStudent({ email, password, name, school, grade }) {
  return apiFetch('/api/auth/signup/student', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, school, grade }),
  })
}

export function signupCompany({
  email,
  password,
  businessNumber,
  company_name,
  industry,
  founded_date,
  contact_name,
  contact_position,
  contact_phone,
}) {
  return apiFetch('/api/auth/signup/company', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      businessNumber,
      company_name,
      industry,
      founded_date,
      contact_name,
      contact_position,
      contact_phone,
    }),
  })
}

export function getOnboarding(companyId) {
  return apiFetch(`/api/onboarding/${companyId}`)
}

export function generateOnboarding({ companyId, jobTitle, companyName, targetDate }) {
  return apiFetch('/api/onboarding/generate', {
    method: 'POST',
    body: JSON.stringify({ companyId, jobTitle, companyName, targetDate }),
  })
}

export function enrollStudent(companyId, studentId) {
  return apiFetch(`/api/onboarding/${companyId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  })
}

export function getEnrollment(companyId, studentId) {
  return apiFetch(`/api/onboarding/${companyId}/enrollment/${studentId}`)
}

export function submitMission(enrollmentId, missionId, content) {
  return apiFetch(`/api/onboarding/enrollments/${enrollmentId}/missions/${missionId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function listSubmissions(enrollmentId) {
  return apiFetch(`/api/onboarding/enrollments/${enrollmentId}/submissions`)
}

export function listJobs() {
  return apiFetch('/api/jobs')
}

export function getJobSchedule(jobId) {
  return apiFetch(`/api/jobs/${jobId}`)
}

function mapScheduleItems(items, period, companyId) {
  return (items ?? []).map((item, index) => ({
    id: `${companyId}-${period}-${index}`,
    period,
    title: item.activity,
    subtitle: item.time,
    importance: item.importance ?? 'medium',
    description: item.activity,
  }))
}

// 실제 API 응답(GET /api/onboarding/:companyId + submissions)을 src/mock/onboarding.js와
// 동일한 모양으로 변환한다. 이렇게 하면 화면 컴포넌트는 mock/실제 데이터를 구분하지 않고 그릴 수 있다.
export function normalizeOnboardingResponse(companyId, data, submissions) {
  const completedMissionIds = new Set((submissions ?? []).map((submission) => submission.mission_id))

  return {
    companyId,
    companyName: data.companyName ?? '',
    jobTitle: data.jobTitle ?? '',
    targetDate: data.targetDate,
    schedules: {
      day: mapScheduleItems(data.schedules?.day, 'day', companyId),
      week: mapScheduleItems(data.schedules?.week, 'week', companyId),
      month: mapScheduleItems(data.schedules?.month, 'month', companyId),
    },
    missions: (data.missions ?? []).map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      submissionType: mission.submissionType ?? 'text',
      options: mission.options,
      completed: completedMissionIds.has(mission.id),
    })),
  }
}

function mapJobScheduleItems(items, period, jobId) {
  return (items ?? []).map((item, index) => ({
    id: `${jobId}-${period}-${index}`,
    period,
    title: item.activity,
    subtitle: item.time,
    importance: item.importance ?? 'medium',
    description: item.activity,
    terms: item.terms ?? [],
  }))
}

// 실제 API 응답(GET /api/jobs/:jobId + jobs_library의 job 메타)을 src/mock/jobs.js와
// 동일한 모양(schedules가 period 필드를 가진 평탄한 배열)으로 변환한다.
export function normalizeJobScheduleResponse(job, data) {
  return {
    id: job.id,
    icon: job.icon,
    name: job.name,
    tagline: job.tagline,
    schedules: [
      ...mapJobScheduleItems(data.schedules?.day, 'day', job.id),
      ...mapJobScheduleItems(data.schedules?.week, 'week', job.id),
      ...mapJobScheduleItems(data.schedules?.month, 'month', job.id),
    ],
  }
}
