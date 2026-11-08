import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import RoleToggle from '../../components/RoleToggle/RoleToggle.jsx'
import DuplicateCheckField from '../../components/DuplicateCheckField/DuplicateCheckField.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import { MailIcon, LockIcon, UserIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

// 가입 흐름: 역할 선택 → 계정 정보(이 화면, 학생·기업 공통) → 학생: 학교 정보 / 기업: 사업자 확인·회사 정보·담당자 정보
// 이메일 형식·중복, 비밀번호 안전성·일치 검사를 이 화면 한 곳에서 입력하는 즉시 끝낸다.
export default function RoleSelectPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  // 다음 화면에서 '돌아가기'로 돌아오면 입력해 둔 계정 정보를 그대로 복원한다.
  const restored = state?.account
  const [wizardStep, setWizardStep] = useState(restored ? 2 : 1)
  const [role, setRole] = useState(state?.role ?? null)
  const [form, setForm] = useState({
    email: restored?.email ?? '',
    name: restored?.name ?? '',
    password: restored?.password ?? '',
    confirmPassword: restored?.password ?? '',
  })
  const [emailCheck, setEmailCheck] = useState(restored ? 'available' : null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})

  const liveErrors = {
    email: touched.email && form.email && !isValidEmail(form.email) ? '올바른 이메일 형식이 아닙니다.' : '',
    password:
      touched.password && form.password && !isValidPassword(form.password) ? '비밀번호는 8자 이상이어야 합니다.' : '',
    confirmPassword:
      form.confirmPassword && !doPasswordsMatch(form.password, form.confirmPassword)
        ? '비밀번호가 일치하지 않습니다.'
        : '',
  }
  const passwordsMatch = doPasswordsMatch(form.password, form.confirmPassword)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    if (name === 'email') setEmailCheck(null)
  }

  function markTouched(name) {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  async function handleCheckEmail() {
    markTouched('email')
    if (!isRequired(form.email)) {
      setErrors((prev) => ({ ...prev, email: '이메일을 입력해주세요.' }))
      return
    }
    if (!isValidEmail(form.email)) return
    setCheckingEmail(true)
    setErrors((prev) => ({ ...prev, email: '' }))
    try {
      const { available } = await api.checkEmail(form.email.trim())
      setEmailCheck(available ? 'available' : 'taken')
    } catch (error) {
      setEmailCheck(null)
      setErrors((prev) => ({ ...prev, email: error.message ?? '이메일 중복 확인 중 오류가 발생했습니다.' }))
    } finally {
      setCheckingEmail(false)
    }
  }

  function validate() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck === 'taken') nextErrors.email = '이미 사용 중인 이메일입니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복확인을 해주세요.'
    if (!isRequired(form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isValidPassword(form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(form.password, form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    if (!role) nextErrors.role = '학생 또는 기업을 선택해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const target = role === 'company' ? '/signup/company?step=1' : '/signup/student'
    navigate(target, { state: { email: form.email.trim(), name: form.name.trim(), password: form.password } })
  }

  if (wizardStep === 1) {
    return (
      <AuthLayout size="lg">
        <p className={styles.title}>어떤 계정으로 시작할까요?</p>
        <p className={styles.subtitle}>가입 유형에 따라 이용할 수 있는 기능이 달라집니다.</p>
        <div className={`${styles.form} ${styles.roleForm}`}>
          <RoleToggle
            value={role}
            onChange={(nextRole) => {
              setRole(nextRole)
              setErrors({})
              setWizardStep(2)
            }}
          />
          {errors.role && <p className={styles.roleError}>{errors.role}</p>}
        </div>
        <p className={styles.footer}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <p className={styles.title}>계정 정보를 입력해주세요</p>
      <p className={styles.subtitle}>로그인에 사용할 이메일과 비밀번호를 설정합니다.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <DuplicateCheckField
          label="이메일"
          icon={<MailIcon />}
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={() => markTouched('email')}
          placeholder="이메일"
          error={errors.email || liveErrors.email}
          status={emailCheck}
          checking={checkingEmail}
          onCheck={handleCheckEmail}
        />
        <Input
          label="이름"
          name="name"
          type="text"
          placeholder="이름"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          icon={<UserIcon />}
          autoComplete="name"
        />
        <div>
          <Input
            name="password"
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            onBlur={() => markTouched('password')}
            error={errors.password || liveErrors.password}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={form.password} />
        </div>
        <div>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="비밀번호 확인"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword || liveErrors.confirmPassword}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          {passwordsMatch && <p className={styles.fieldSuccess}>비밀번호가 일치합니다.</p>}
        </div>
        <button type="button" className={styles.backButton} onClick={() => setWizardStep(1)}>
          돌아가기
        </button>
        <Button type="submit" variant="primary" className={styles.submit}>
          다음
        </Button>
      </form>
      <p className={styles.footer}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </AuthLayout>
  )
}
