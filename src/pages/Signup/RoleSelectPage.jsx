import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import RoleToggle from '../../components/RoleToggle/RoleToggle.jsx'
import Stepper from '../../components/Stepper/Stepper.jsx'
import { MailIcon, LockIcon, UserIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import styles from './SignupForm.module.css'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  // 화면 이동(1: 역할 선택 → 2: 계정 정보)만 위한 로컬 상태입니다.
  // 검증 규칙(validate)과 최종 제출(navigate) 로직은 기존과 동일합니다.
  const [wizardStep, setWizardStep] = useState(1)
  const [form, setForm] = useState({ email: '', name: '', password: '', confirmPassword: '' })
  const [role, setRole] = useState(null)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleRoleNext() {
    if (!role) {
      setErrors({ role: '학생 또는 기업을 선택해주세요.' })
      return
    }
    setErrors({})
    setWizardStep(2)
  }

  function validate() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
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
    console.log('signup role select', { ...form, role })
    const target = role === 'company' ? '/signup/company?step=1' : `/signup/${role}`
    navigate(target, { state: { ...form } })
  }

  if (wizardStep === 1) {
    return (
      <AuthLayout size="lg">
        <p className={styles.title}>어떤 계정으로 시작할까요?</p>
        <p className={styles.subtitle}>가입 유형에 따라 이용할 수 있는 기능이 달라집니다.</p>
        <div className={styles.form}>
          <RoleToggle value={role} onChange={setRole} />
          {errors.role && <p className={styles.roleError}>{errors.role}</p>}
          <Button type="button" variant="primary" className={styles.submit} onClick={handleRoleNext}>
            다음
          </Button>
        </div>
        <p className={styles.footer}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.stepperRow}>
        <Stepper current={1} total={role === 'company' ? 4 : 2} label="계정 정보" />
      </div>
      <p className={styles.title}>계정 정보를 입력해주세요</p>
      <p className={styles.subtitle}>로그인에 사용할 이메일과 비밀번호를 설정합니다.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="이메일"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          icon={<MailIcon />}
          autoComplete="email"
        />
        <Input
          label="이름"
          name="name"
          type="text"
          placeholder="실명을 입력해주세요"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          icon={<UserIcon />}
          autoComplete="name"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="8자 이상, 영문·숫자 조합"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <Input
          label="비밀번호 확인"
          name="confirmPassword"
          type="password"
          placeholder="비밀번호를 한 번 더 입력해주세요"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <button type="button" className={styles.backButton} onClick={() => setWizardStep(1)}>
          ← 이전
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
