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
    submissionType: mission.submissionType ?? 'text',
    ...(mission.options ? { options: mission.options } : {}),
  }))
}

async function fetchOnboardingRow(companyId) {
  const { data, error } = await supabaseAdmin
    .from('company_onboarding')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[onboarding] fetchOnboardingRow 실패:', error)
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
    console.error('[onboarding] saveMissions 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '미션 정보 저장 중 오류가 발생했습니다.')
  }
  return data
}

async function fetchCompanyName(companyId) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('company_name')
    .eq('id', companyId)
    .maybeSingle()

  if (error || !data) return null
  return data.company_name
}

export async function generateOnboarding({ companyId, jobTitle, companyName, targetDate }) {
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
        target_date: targetDate ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('[onboarding] generateOnboarding - upsert 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '온보딩 정보 저장 중 오류가 발생했습니다.')
  }

  return {
    schedules: data.schedules,
    missions: data.missions,
    jobTitle: data.job_title,
    companyName,
    targetDate: data.target_date,
  }
}

export async function getOnboarding(companyId) {
  if (!isNonEmptyString(companyId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId가 필요합니다.')
  }
  const row = await fetchOnboardingRow(companyId)
  const companyName = await fetchCompanyName(companyId)
  return {
    schedules: row.schedules,
    missions: row.missions,
    jobTitle: row.job_title,
    companyName,
    targetDate: row.target_date,
    createdAt: row.created_at,
  }
}

export async function updateOnboarding(companyId, { schedules, missions, targetDate }) {
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
    .update({
      schedules,
      missions: normalizeMissions(missions),
      ...(targetDate !== undefined ? { target_date: targetDate } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) {
    console.error('[onboarding] updateOnboarding 실패:', error)
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
    console.error('[onboarding] updateProgress 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '진도 정보 저장 중 오류가 발생했습니다.')
  }

  return { success: true, progressPercent: data.progress_percent, updatedAt: data.updated_at }
}

export async function enrollStudent(companyId, studentId) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, studentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_enrollment')
    .upsert({ company_id: companyId, student_id: studentId }, { onConflict: 'student_id,company_id' })
    .select()
    .single()

  if (error) {
    console.error('[onboarding] enrollStudent 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 정보 저장 중 오류가 발생했습니다.')
  }

  return { enrollmentId: data.id, targetDate: data.target_date }
}

export async function removeStudentEnrollment(companyId, studentId) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, studentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_enrollment')
    .delete()
    .eq('company_id', companyId)
    .eq('student_id', studentId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[onboarding] removeStudentEnrollment 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '학생 삭제 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '등록된 학생을 찾을 수 없습니다.')
  }

  return { success: true }
}

export async function getEnrollment(companyId, studentId) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, studentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_enrollment')
    .select('id, target_date')
    .eq('company_id', companyId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) {
    console.error('[onboarding] getEnrollment 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 정보 조회 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '등록 정보를 찾을 수 없습니다.')
  }

  return { enrollmentId: data.id, targetDate: data.target_date }
}

export async function updateStudentTargetDate(companyId, studentId, targetDate) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, studentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_enrollment')
    .update({ target_date: targetDate ?? null })
    .eq('company_id', companyId)
    .eq('student_id', studentId)
    .select('id, target_date')
    .maybeSingle()

  if (error) {
    console.error('[onboarding] updateStudentTargetDate 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '실습 시작일 저장 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '등록된 학생을 찾을 수 없습니다.')
  }

  return { success: true, targetDate: data.target_date }
}

export async function submitMission(enrollmentId, missionId, content) {
  if (!isNonEmptyString(enrollmentId) || !isNonEmptyString(missionId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'enrollmentId, missionId가 필요합니다.')
  }

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('student_enrollment')
    .select('company_id')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (enrollmentError) {
    console.error('[onboarding] submitMission - enrollment 조회 실패:', enrollmentError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 정보 조회 중 오류가 발생했습니다.')
  }
  if (!enrollment) {
    throw new OnboardingError(404, 'NOT_FOUND', '등록 정보를 찾을 수 없습니다.')
  }

  const row = await fetchOnboardingRow(enrollment.company_id)
  const missionExists = (row.missions ?? []).some((mission) => mission.id === missionId)
  if (!missionExists) {
    throw new OnboardingError(404, 'NOT_FOUND', '미션을 찾을 수 없습니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('mission_submission')
    .insert({ enrollment_id: enrollmentId, mission_id: missionId, content: content ?? null })
    .select()
    .single()

  if (error) {
    console.error('[onboarding] submitMission - insert 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '미션 제출 저장 중 오류가 발생했습니다.')
  }

  return { success: true, submission: data }
}

export async function getStudentEnrollments(studentId) {
  if (!isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'studentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('student_enrollment')
    .select('company_id, enrolled_at')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })

  if (error) {
    console.error('[onboarding] getStudentEnrollments 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 정보 조회 중 오류가 발생했습니다.')
  }

  return (data ?? []).map((row) => ({ companyId: row.company_id, enrolledAt: row.enrolled_at }))
}

export async function listEnrolledStudents(companyId) {
  if (!isNonEmptyString(companyId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId가 필요합니다.')
  }

  const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
    .from('student_enrollment')
    .select('id, student_id, enrolled_at')
    .eq('company_id', companyId)

  if (enrollmentsError) {
    console.error('[onboarding] listEnrolledStudents - enrollment 조회 실패:', enrollmentsError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 학생 목록 조회 중 오류가 발생했습니다.')
  }
  if (!enrollments?.length) return []

  const studentIds = enrollments.map((e) => e.student_id)
  const enrollmentIds = enrollments.map((e) => e.id)

  const { data: students, error: studentsError } = await supabaseAdmin
    .from('students')
    .select('id, name')
    .in('id', studentIds)
  if (studentsError) {
    console.error('[onboarding] listEnrolledStudents - students 조회 실패:', studentsError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '학생 정보 조회 중 오류가 발생했습니다.')
  }

  const { data: users, error: usersError } = await supabaseAdmin.from('users').select('id, email').in('id', studentIds)
  if (usersError) {
    console.error('[onboarding] listEnrolledStudents - users 조회 실패:', usersError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '사용자 정보 조회 중 오류가 발생했습니다.')
  }

  const { data: onboardingRow } = await supabaseAdmin
    .from('company_onboarding')
    .select('missions')
    .eq('company_id', companyId)
    .maybeSingle()
  const totalMissions = onboardingRow?.missions?.length ?? 0

  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('mission_submission')
    .select('enrollment_id, mission_id, submitted_at')
    .in('enrollment_id', enrollmentIds)
  if (submissionsError) {
    console.error('[onboarding] listEnrolledStudents - submissions 조회 실패:', submissionsError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '제출 내역 조회 중 오류가 발생했습니다.')
  }

  const studentById = new Map((students ?? []).map((s) => [s.id, s]))
  const emailById = new Map((users ?? []).map((u) => [u.id, u.email]))

  return enrollments.map((enrollment) => {
    const subs = (submissions ?? []).filter((s) => s.enrollment_id === enrollment.id)
    const completedCount = new Set(subs.map((s) => s.mission_id)).size
    const lastSubmittedAt = subs.reduce(
      (latest, s) => (!latest || s.submitted_at > latest ? s.submitted_at : latest),
      null,
    )
    const student = studentById.get(enrollment.student_id)

    return {
      studentId: enrollment.student_id,
      name: student?.name ?? '알 수 없음',
      email: emailById.get(enrollment.student_id) ?? '',
      progress: totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0,
      completedCount,
      totalMissions,
      lastAccess: lastSubmittedAt ?? enrollment.enrolled_at,
    }
  })
}

export async function getStudentDetail(companyId, studentId) {
  if (!isNonEmptyString(companyId) || !isNonEmptyString(studentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId, studentId가 필요합니다.')
  }

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('student_enrollment')
    .select('id, target_date')
    .eq('company_id', companyId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (enrollmentError) {
    console.error('[onboarding] getStudentDetail - enrollment 조회 실패:', enrollmentError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '학생 등록 정보 조회 중 오류가 발생했습니다.')
  }
  if (!enrollment) {
    throw new OnboardingError(404, 'NOT_FOUND', '등록된 학생을 찾을 수 없습니다.')
  }

  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select('name, school, age')
    .eq('id', studentId)
    .maybeSingle()
  if (studentError) {
    console.error('[onboarding] getStudentDetail - student 조회 실패:', studentError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '학생 정보 조회 중 오류가 발생했습니다.')
  }

  const { data: userRow } = await supabaseAdmin.from('users').select('email').eq('id', studentId).maybeSingle()

  let missions = []
  try {
    const row = await fetchOnboardingRow(companyId)
    missions = row.missions ?? []
  } catch (err) {
    if (!(err instanceof OnboardingError && err.code === 'NOT_FOUND')) throw err
  }

  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('mission_submission')
    .select('id, mission_id, content, feedback, submitted_at')
    .eq('enrollment_id', enrollment.id)
    .order('submitted_at', { ascending: false })
  if (submissionsError) {
    console.error('[onboarding] getStudentDetail - submissions 조회 실패:', submissionsError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '제출 내역 조회 중 오류가 발생했습니다.')
  }

  const submissionByMissionId = new Map()
  for (const submission of submissions ?? []) {
    if (!submissionByMissionId.has(submission.mission_id)) submissionByMissionId.set(submission.mission_id, submission)
  }

  const completedMissions = []
  const incompletedMissions = []
  for (const mission of missions) {
    const submission = submissionByMissionId.get(mission.id)
    if (submission) {
      completedMissions.push({
        id: mission.id,
        title: mission.title,
        submissionType: mission.submissionType ?? 'text',
        submissionId: submission.id,
        content: submission.content,
        feedback: submission.feedback,
        submittedAt: submission.submitted_at,
      })
    } else {
      incompletedMissions.push({ id: mission.id, title: mission.title })
    }
  }

  return {
    name: student?.name ?? '알 수 없음',
    school: student?.school ?? '',
    age: student?.age ?? null,
    email: userRow?.email ?? '',
    targetDate: enrollment.target_date,
    progress: missions.length ? Math.round((completedMissions.length / missions.length) * 100) : 0,
    completedMissions,
    incompletedMissions,
  }
}

export async function registerStudentsByEmail(companyId, emails) {
  if (!isNonEmptyString(companyId) || !Array.isArray(emails) || emails.length === 0) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'companyId와 이메일 목록이 필요합니다.')
  }

  const results = { success: 0, failed: 0, failedEmails: [] }

  for (const rawEmail of emails) {
    const email = String(rawEmail).trim()
    if (!email) continue

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, user_type')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      console.error('[onboarding] registerStudentsByEmail - user 조회 실패:', userError)
      results.failed += 1
      results.failedEmails.push(email)
      continue
    }
    if (!userRow || userRow.user_type !== 'student') {
      results.failed += 1
      results.failedEmails.push(email)
      continue
    }

    try {
      await enrollStudent(companyId, userRow.id)
      results.success += 1
    } catch (err) {
      console.error('[onboarding] registerStudentsByEmail - enroll 실패:', err)
      results.failed += 1
      results.failedEmails.push(email)
    }
  }

  return results
}

export async function sendMissionFeedback(submissionId, feedback) {
  if (!isNonEmptyString(submissionId) || !isNonEmptyString(feedback)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'submissionId와 feedback이 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('mission_submission')
    .update({ feedback })
    .eq('id', submissionId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('[onboarding] sendMissionFeedback 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '피드백 저장 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '제출 내역을 찾을 수 없습니다.')
  }

  return { success: true, feedback: data.feedback }
}

export async function listSubmissions(enrollmentId) {
  if (!isNonEmptyString(enrollmentId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'enrollmentId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('mission_submission')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('[onboarding] listSubmissions 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '제출 내역 조회 중 오류가 발생했습니다.')
  }

  return data ?? []
}
