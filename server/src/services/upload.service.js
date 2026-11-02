import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { OnboardingError } from '../utils/errors.js'
import { getAssignedOnboarding } from './onboardingVersions.service.js'

const BUCKET = 'mission-submissions'

export async function uploadMissionFile({ enrollmentId, missionId, file }) {
  if (!file) {
    throw new OnboardingError(400, 'INVALID_INPUT', '파일이 필요합니다.')
  }
  const { data: enrollment, error: enrollmentError } = await supabaseAdmin.from('student_enrollment')
    .select('company_id, student_id').eq('id', enrollmentId).maybeSingle()
  if (enrollmentError) throw new OnboardingError(502, 'SUPABASE_ERROR', '등록 정보 조회에 실패했습니다.')
  if (!enrollment) throw new OnboardingError(404, 'NOT_FOUND', '등록 정보를 찾을 수 없습니다.')
  const plan = await getAssignedOnboarding(enrollment.company_id, enrollment.student_id)
  if (!plan.missions?.some((m) => m.id === missionId && m.submissionType === 'file')) {
    throw new OnboardingError(400, 'INVALID_INPUT', '파일 제출 미션이 아닙니다.')
  }

  const path = `${enrollmentId}/${missionId}/${randomUUID()}-${file.originalname}`

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  })

  if (error) {
    console.error('[upload] uploadMissionFile 실패:', error)
    throw new OnboardingError(502, 'SUPABASE_ERROR', '파일 업로드 중 오류가 발생했습니다.')
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

  return { url: data.publicUrl, fileName: file.originalname }
}
