import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../config/supabase.js'
import { OnboardingError } from '../utils/errors.js'

const BUCKET = 'mission-submissions'

export async function uploadMissionFile({ enrollmentId, missionId, file }) {
  if (!file) {
    throw new OnboardingError(400, 'INVALID_INPUT', '파일이 필요합니다.')
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
