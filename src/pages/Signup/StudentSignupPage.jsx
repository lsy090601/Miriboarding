import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import Stepper from '../../components/Stepper/Stepper.jsx'
import DuplicateCheckField from '../../components/DuplicateCheckField/DuplicateCheckField.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import { MailIcon, LockIcon, UserIcon, CapIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import { checkEmailExists } from '../../api/mockApi.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

export default function StudentSignupPage() {
  const { state } = useLocation()
  // 화면 이동(1: 계정 정보 → 2: 학교 정보)만 위한 로컬 상태입니다.
  // validate()·api.signupStudent 호출은 기존과 동일하게 마지막 제출에서만 실행됩니다.
  const [wizardStep, setWizardStep] = useState(1)
  const [form, setForm] = useState({
    email: state?.email ?? '',
    password: state?.password ?? '',
    confirmPassword: state?.confirmPassword ?? '',
    name: state?.name ?? '',
    school: '',
    age: '',
  })
  const [emailCheck, setEmailCheck] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false, marketing: false })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailCheck(null)
  }

  async function handleCheckEmail() {
    if (!isValidEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }))
      return
    }
    setCheckingEmail(true)
    const result = await checkEmailExists(form.email)
    setCheckingEmail(false)
    setEmailCheck(result.exists ? 'taken' : 'available')
  }

  function handleStep1Next() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복 확인을 해주세요.'
    if (!isValidPassword(form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(form.password, form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setWizardStep(2)
  }

  function validate() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복 확인을 해주세요.'
    if (!isValidPassword(form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(form.password, form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    if (!isRequired(form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isRequired(form.school)) nextErrors.school = '학교를 입력해주세요.'
    if (!isRequired(String(form.age))) nextErrors.age = '나이를 입력해주세요.'
    else if (!Number.isInteger(Number(form.age)) || Number(form.age) <= 0)
      nextErrors.age = '올바른 나이를 입력해주세요.'
    if (!terms.tos || !terms.privacy || !terms.age) nextErrors.terms = '약관에 모두 동의해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await api.signupStudent({
        email: form.email,
        password: form.password,
        name: form.name,
        school: form.school,
        age: Number(form.age),
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: '이미 가입된 이메일입니다.' })
        setWizardStep(1)
      } else {
        setErrors({ name: error.message ?? '회원가입 중 오류가 발생했습니다.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout>
        <div className={styles.form}>
          <p className={styles.successText}>회원가입이 완료되었습니다!</p>
          <Link to="/login" className={styles.footerLink}>
            로그인하러 가기
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (wizardStep === 1) {
    return (
      <AuthLayout>
        <div className={styles.stepperRow}>
          <Stepper current={1} total={2} label="계정 정보" />
        </div>
        <p className={styles.title}>계정 정보를 입력해주세요</p>
        <p className={styles.subtitle}>로그인에 사용할 이메일과 비밀번호를 설정합니다.</p>
        <div className={styles.form}>
          <DuplicateCheckField
            label="이메일"
            icon={<MailIcon />}
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            error={errors.email}
            status={emailCheck}
            checking={checkingEmail}
            onCheck={handleCheckEmail}
          />
          <div>
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
            <PasswordStrengthMeter password={form.password} />
          </div>
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
          <Button type="button" variant="primary" className={styles.submit} onClick={handleStep1Next}>
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
        <Stepper current={2} total={2} label="학교 정보" />
      </div>
      <p className={styles.title}>학교 정보를 알려주세요</p>
      <p className={styles.subtitle}>학교와 학년에 맞는 직무 체험을 추천해드려요.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
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
          label="학교명"
          name="school"
          type="text"
          placeholder="학교를 입력해주세요"
          value={form.school}
          onChange={handleChange}
          error={errors.school}
          icon={<CapIcon />}
        />
        <Input
          label="나이"
          name="age"
          type="number"
          placeholder="나이를 입력해주세요"
          value={form.age}
          onChange={handleChange}
          error={errors.age}
          icon={<CapIcon />}
        />
        <TermsCheckboxes value={terms} onChange={setTerms} error={errors.terms} />
        <button type="button" className={styles.backButton} onClick={() => setWizardStep(1)}>
          ← 이전
        </button>
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '가입 완료하기'}
        </Button>
      </form>
      <p className={styles.footer}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </AuthLayout>
  )
}
