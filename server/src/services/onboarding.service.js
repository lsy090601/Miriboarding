import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { isNonEmptyString } from '../utils/validation.js'
import { OnboardingError } from '../utils/errors.js'
import { generateOnboardingPlan } from './gemini.service.js'

const GENERATE_COOLDOWN_MS = 60_000
const lastGenerateAtByCompany = new Map()

function checkGenerateRateLimit(companyId) {
  const now = Date.now()
  const lastAt = lastGenerateAtByCompany.get(companyId)
  if (lastAt && now - lastAt < GENERATE_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((GENERATE_COOLDOWN_MS - (now - lastAt)) / 1000)
    throw new OnboardingError(429, 'RATE_LIMITED', `잠시 후 다시 시도해주세요. (${waitSeconds}초 남음)`)
  }
  lastGenerateAtByCompany.set(companyId, now)
}

function normalizeMissions(rawMissions) {
  return rawMissions.map((mission, index) => ({
    id: mission.id ?? randomUUID(),
    title: mission.title,
    description: mission.description,
    order: mission.order ?? index + 1,
  }))
}

async function fetchOnboardingRow(companyId) {
  const { data, error } = await supabaseAdmin
    .from('company_onboarding')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    throw new OnboardingError(502, 'SUPABASE_ERROR', '온보딩 정보 조회 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '온보딩 정보를 찾을 수 없습니다.')
  }
  return data
}

async function saveMissions(companyId, missions) {
  const { data, error } = await supabaseAdmin
    .from('company_onboarding')
    .update({ missions, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) {
    throw new OnboardingError(502, 'SUPABASE_ERROR', '미션 정보 저장 중 오류가 발생했습니다.')
  }
  return data
}

export async function generateOnboarding({ companyId, jobTitle, companyName }) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(jobTitle) || !isNonEmptyString(companyName)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, jobTitle, companyName을 모두 입력해주세요.')
  }

  checkGenerateRateLimit(companyId)

  const plan = await generateOnboardingPlan({ jobTitle, companyName })
  const missions = normalizeMissions(plan.missions)

  const { data, error } = await supabaseAdmin
    .from('company_onboarding')
    .upsert(
      {
        company_id: companyId,
        job_title: jobTitle,
        schedules: plan.schedules,
        missions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id' },
    )
    .select()
    .single()

  if (error) {
    throw new OnboardingError(502, 'SUPABASE_ERROR', '온보딩 정보 저장 중 오류가 발생했습니다.')
  }

  return { schedules: data.schedules, missions: data.missions }
}

export async function getOnboarding(companyId) {
  if (!isNonEmptyString(companyId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId가 필요합니다.')
  }
  const row = await fetchOnboardingRow(companyId)
  return { schedules: row.schedules, missions: row.missions, createdAt: row.created_at }
}

export async function updateOnboarding(companyId, { schedules, missions }) {
  if (!isNonEmptyString(companyId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId가 필요합니다.')
  }
  if (!schedules || typeof schedules !== 'object' || Array.isArray(schedules)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'schedules가 올바르지 않습니다.')
  }
  if (!Array.isArray(missions)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'missions가 올바르지 않습니다.')
  }

  await fetchOnboardingRow(companyId)

  const { data, error } = await supabaseAdmin
    .from('company_onboarding')
    .update({ schedules, missions: normalizeMissions(missions), updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) {
    throw new OnboardingError(502, 'SUPABASE_ERROR', '온보딩 정보 수정 중 오류가 발생했습니다.')
  }

  return { success: true, updatedAt: data.updated_at }
}

export async function listMissions(companyId) {
  const row = await fetchOnboardingRow(companyId)
  return row.missions ?? []
}

export async function createMission(companyId, { title, description }) {
  if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'title, description을 모두 입력해주세요.')
  }

  const row = await fetchOnboardingRow(companyId)
  const missions = row.missions ?? []
  const mission = { id: randomUUID(), title, description, order: missions.length + 1 }
  await saveMissions(companyId, [...missions, mission])

  return mission
}

export async function updateMission(companyId, missionId, { title, description }) {
  if (!isNonEmptyString(missionId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'missionId가 필요합니다.')
  }

  const row = await fetchOnboardingRow(companyId)
  const missions = row.missions ?? []
  const index = missions.findIndex((mission) => mission.id === missionId)
  if (index === -1) {
    throw new OnboardingError(404, 'NOT_FOUND', '미션을 찾을 수 없습니다.')
  }

  const updatedMission = {
    ...missions[index],
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
  }
  const nextMissions = [...missions]
  nextMissions[index] = updatedMission
  await saveMissions(companyId, nextMissions)

  return updatedMission
}

export async function deleteMission(companyId, missionId) {
  if (!isNonEmptyString(missionId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'missionId가 필요합니다.')
  }

  const row = await fetchOnboardingRow(companyId)
  const missions = row.missions ?? []
  const nextMissions = missions.filter((mission) => mission.id !== missionId)
  if (nextMissions.length === missions.length) {
    throw new OnboardingError(404, 'NOT_FOUND', '미션을 찾을 수 없습니다.')
  }

  await saveMissions(companyId, nextMissions)
}

export async function updateProgress(enrollmentId, progressPercent) {
  if (!isNonEmptyString(enrollmentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'enrollmentId가 필요합니다.')
  }
  const percent = Number(progressPercent)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'progressPercent는 0~100 사이의 숫자여야 합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_progress')
    .upsert(
      { enrollment_id: enrollmentId, progress_percent: percent, updated_at: new Date().toISOString() },
      { onConflict: 'enrollment_id' },
    )
    .select()
    .single()

  if (error) {
    throw new OnboardingError(502, 'SUPABASE_ERROR', '진도 정보 저장 중 오류가 발생했습니다.')
  }

  return { success: true, progressPercent: data.progress_percent, updatedAt: data.updated_at }
}
