import { supabaseAuth, supabaseAdmin } from '../config/supabase.js'

function reject(res, status, code, message) {
  return res.status(status).json({ success: false, code, message })
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return reject(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.')

  const { data, error } = await supabaseAuth.auth.getUser(token)
  if (error || !data?.user) return reject(res, 401, 'UNAUTHORIZED', '로그인이 만료되었습니다.')

  const { data: userRow, error: userError } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', data.user.id)
    .single()

  if (userError || !userRow) return reject(res, 401, 'UNAUTHORIZED', '사용자 정보를 확인할 수 없습니다.')
  req.auth = { userId: data.user.id, userType: userRow.user_type }
  next()
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.auth?.userType !== role) return reject(res, 403, 'FORBIDDEN', '접근 권한이 없습니다.')
    next()
  }
}

export function requireOwnParam(paramName) {
  return (req, res, next) => {
    if (req.params[paramName] !== req.auth?.userId) return reject(res, 403, 'FORBIDDEN', '다른 계정의 정보에는 접근할 수 없습니다.')
    next()
  }
}

export function requireOwnBody(fieldName) {
  return (req, res, next) => {
    if (req.body?.[fieldName] !== req.auth?.userId) return reject(res, 403, 'FORBIDDEN', '다른 계정의 정보에는 접근할 수 없습니다.')
    next()
  }
}
