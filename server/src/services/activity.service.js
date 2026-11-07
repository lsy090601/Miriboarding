import { supabaseAdmin } from '../config/supabase.js'

const lastRecorded = new Map()
const RECORD_INTERVAL_MS = 60_000

export async function recordActivity(userId, force = false) {
  const now = Date.now()
  if (!force && now - (lastRecorded.get(userId) ?? 0) < RECORD_INTERVAL_MS) return
  const { error } = await supabaseAdmin.from('users')
    .update({ last_seen_at: new Date(now).toISOString() }).eq('id', userId)
  if (error) {
    // 접속 기록 장애가 정상적인 로그인과 학습을 막지 않도록 한다.
    console.warn('[activity] 접속 시각 저장 실패:', error.code)
    return
  }
  lastRecorded.set(userId, now)
  // 장시간 실행 시 메모리가 계속 늘지 않도록 만료된 항목을 정리한다.
  if (lastRecorded.size > 1000) {
    for (const [id, at] of lastRecorded) if (now - at >= RECORD_INTERVAL_MS) lastRecorded.delete(id)
  }
}
