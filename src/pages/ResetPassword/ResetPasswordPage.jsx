import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import { LockIcon } from '../../components/icons/Icons.jsx'
import { isValidPassword, doPasswordsMatch } from '../../utils/validation.js'
import { supabase } from '../../lib/supabaseClient.js'
import styles from './ResetPasswordPage.module.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidPassword(password)) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (!doPasswordsMatch(password, confirmPassword)) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setError('')
    setIsSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)
    if (updateError) {
      setError(updateError.message ?? '비밀번호 변경 중 오류가 발생했습니다.')
      return
    }
    setDone(true)
    setTimeout(() => navigate('/login'), 1500)
  }

  if (done) {
    return (
      <AuthLayout>
        <p className={styles.message}>비밀번호가 변경됐어요. 로그인 화면으로 이동합니다...</p>
      </AuthLayout>
    )
  }

  if (!ready) {
    return (
      <AuthLayout>
        <p className={styles.message}>유효하지 않거나 만료된 링크예요. 로그인 화면에서 다시 시도해주세요.</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.title}>새 비밀번호 설정</p>
        <div>
          <Input
            name="password"
            type="password"
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </form>
    </AuthLayout>
  )
}
