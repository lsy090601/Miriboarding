import { supabaseAdmin } from '../config/supabase.js'
import { OnboardingError } from '../utils/errors.js'

const hasText = value => typeof value === 'string' && value.trim().length > 0

export function versionError(error) {
  if (['PGRST205', 'PGRST202', 'PGRST204', '42P01', '42703'].includes(error?.code)) {
    return new OnboardingError(503, 'MIGRATION_REQUIRED', '온보딩 버전 DB 변경(0005)을 먼저 적용해주세요.')
  }
  return new OnboardingError(502, 'SUPABASE_ERROR', '온보딩 버전 처리에 실패했습니다.')
}

export async function getVersion(companyId, versionId) {
  const { data, error } = await supabaseAdmin.from('company_onboarding_versions')
    .select('*').eq('company_id', companyId).eq('id', versionId).maybeSingle()
  if (error) throw versionError(error)
  if (!data) throw new OnboardingError(404, 'NOT_FOUND', '온보딩 버전을 찾을 수 없습니다.')
  return data
}

export async function listVersions(companyId) {
  const { data, error } = await supabaseAdmin.from('company_onboarding_versions')
    .select('id, job_title, status, created_at, published_at').eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw versionError(error)
  return data
}

export async function saveDraft(companyId, versionId, changes) {
  const row = await getVersion(companyId, versionId)
  if (row.status !== 'draft') throw new OnboardingError(409, 'PUBLISHED_READ_ONLY', '배포한 온보딩은 수정할 수 없습니다. 새 초안을 생성해주세요.')
  const { data, error } = await supabaseAdmin.from('company_onboarding_versions')
    .update({ ...changes, updated_at: new Date().toISOString() }).eq('company_id', companyId)
    .eq('id', versionId).eq('status', 'draft').select().maybeSingle()
  if (error) {
    if (error.message?.includes('PUBLISHED_VERSION_READ_ONLY')) throw new OnboardingError(409, 'PUBLISHED_READ_ONLY', '이미 배포한 버전입니다.')
    throw versionError(error)
  }
  if (!data) throw new OnboardingError(409, 'PUBLISHED_READ_ONLY', '이미 배포한 버전입니다.')
  return data
}

export async function publishVersion(companyId, versionId) {
  const row = await getVersion(companyId, versionId)
  if (!row.missions?.length) throw new OnboardingError(400, 'INVALID_INPUT', '미션을 하나 이상 추가해주세요.')
  for (const period of ['day', 'week', 'month']) {
    if (!Array.isArray(row.schedules?.[period]) || !row.schedules[period].length ||
      row.schedules[period].some(item => !hasText(item?.time) || !hasText(item?.activity))) {
      throw new OnboardingError(400, 'INVALID_INPUT', '하루·1주·1달 일정의 시간과 활동 내용을 입력해주세요.')
    }
  }
  const ids = new Set()
  for (const mission of row.missions) {
    if (!hasText(mission?.title) || !hasText(mission?.description) || !['text', 'file', 'choice'].includes(mission.submissionType) || ids.has(mission.id)) {
      throw new OnboardingError(400, 'INVALID_INPUT', '미션의 제목·설명·제출 유형을 확인해주세요.')
    }
    ids.add(mission.id)
    if (mission.submissionType === 'choice' && (!Array.isArray(mission.options) || !mission.options.length || mission.options.some(option => !hasText(option)) || new Set(mission.options).size !== mission.options.length)) {
      throw new OnboardingError(400, 'INVALID_INPUT', '선택형 미션에는 중복되지 않는 선택지를 입력해주세요.')
    }
  }
  const { data, error } = await supabaseAdmin.rpc('publish_onboarding_version', { p_company_id: companyId, p_version_id: versionId })
  if (error) throw versionError(error)
  return { success: true, versionId: data.id }
}

export async function getAssignedOnboarding(companyId, studentId) {
  const { data, error } = await supabaseAdmin.from('student_enrollment').select('*')
    .eq('company_id', companyId).eq('student_id', studentId).maybeSingle()
  if (error) throw versionError(error)
  if (!data) throw new OnboardingError(404, 'NOT_FOUND', '회사 담당자에게 온보딩 등록을 요청해주세요.')
  // 0005 적용 전에는 기존 배포 계획을 사용한다. 초안 생성은 DB 변경 전 차단된다.
  if (data.onboarding_snapshot) return data.onboarding_snapshot
  const { data: current, error: currentError } = await supabaseAdmin.from('company_onboarding')
    .select('*').eq('company_id', companyId).maybeSingle()
  if (currentError) throw versionError(currentError)
  if (!current) throw new OnboardingError(404, 'NOT_FOUND', '배정된 온보딩을 찾을 수 없습니다.')
  return current
}
