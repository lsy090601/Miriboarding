import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Supabase 환경변수(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다. .env를 확인해주세요.',
  )
}

// 회원가입/로그인 등 실제 Auth 플로우(이메일 확인 발송 포함)는 anon key로 처리한다.
export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// users/students/companies 테이블 쓰기는 RLS를 우회해야 하므로 service role key를 사용한다.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
