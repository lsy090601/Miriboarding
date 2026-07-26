import { supabaseAdmin } from '../config/supabase.js'
import { isNonEmptyString } from '../utils/validation.js'
import { OnboardingError } from '../utils/errors.js'
import { generateJobSchedulePlan } from './gemini.service.js'
import { getNcsContentForJob } from './ncs.service.js'

export async function listJobs() {
  const { data, error } = await supabaseAdmin
    .from('jobs_library')
    .select('id, job_title, description')
    .order('job_title', { ascending: true })

  if (error) {
    console.error('[jobs] listJobs 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '직무 목록 조회 중 오류가 발생했습니다.')
  }

  return data ?? []
}

export async function getJobSchedule(jobId) {
  if (!isNonEmptyString(jobId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'jobId가 필요합니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('job_schedules_template')
    .select('schedules')
    .eq('job_id', jobId)
    .maybeSingle()

  if (error) {
    console.error('[jobs] getJobSchedule 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '직무 일정 조회 중 오류가 발생했습니다.')
  }
  if (!data) {
    throw new OnboardingError(404, 'NOT_FOUND', '아직 생성되지 않은 직무 일정입니다.')
  }

  return { schedules: data.schedules }
}

export async function generateJobSchedule(jobId, sourceContent) {
  if (!isNonEmptyString(jobId)) {
    throw new OnboardingError(400, 'INVALID_INPUT', 'jobId가 필요합니다.')
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs_library')
    .select('id, job_title')
    .eq('id', jobId)
    .maybeSingle()

  if (jobError) {
    console.error('[jobs] generateJobSchedule - job 조회 실패:', jobError)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '직무 정보 조회 중 오류가 발생했습니다.')
  }
  if (!job) {
    throw new OnboardingError(404, 'NOT_FOUND', '직무를 찾을 수 없습니다.')
  }

  // 요청에 직접 붙여넣은 자료(sourceContent)가 있으면 그걸 우선 사용하고,
  // 없으면 NCS API 자동 조회를 시도한다(현재는 키 미설정으로 null 폴백).
  const resolvedContent = isNonEmptyString(sourceContent) ? sourceContent : await getNcsContentForJob(job.job_title)
  const plan = await generateJobSchedulePlan({ jobTitle: job.job_title, sourceContent: resolvedContent })

  const { data, error } = await supabaseAdmin
    .from('job_schedules_template')
    .upsert(
      { job_id: jobId, schedules: plan.schedules },
      { onConflict: 'job_id' },
    )
    .select('schedules')
    .single()

  if (error) {
    console.error('[jobs] generateJobSchedule - upsert 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '직무 일정 저장 중 오류가 발생했습니다.')
  }

  return { schedules: data.schedules }
}
