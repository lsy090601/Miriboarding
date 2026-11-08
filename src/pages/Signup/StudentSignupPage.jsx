import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import SchoolSearchField from '../../components/SchoolSearchField/SchoolSearchField.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import { UserIcon, CapIcon } from '../../components/icons/Icons.jsx'
import { isRequired } from '../../utils/validation.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

// 학생 가입의 마지막 화면(학교 정보). 이메일·이름·비밀번호는 앞의 계정 정보 화면에서 이미 받았다.
export default function StudentSignupPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ studentNumber: '', school: '', age: '' })
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false, marketing: false })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 계정 정보 화면을 거치지 않고 주소로 바로 들어온 경우
  if (!state?.email) return <Navigate to="/signup" replace />

  function handleChange(e) {
    const { name, value } = e.target
    // 학번은 숫자만 입력되게 한다. (예: 2310)
    const nextValue = name === 'studentNumber' ? value.replace(/\D/g, '').slice(0, 6) : value
    setForm((prev) => ({ ...prev, [name]: nextValue }))
    setErrors((prev) => ({ ...prev, [name]: '', general: '' }))
  }

  function validate() {
    const nextErrors = {}
    if (!/^\d{3,6}$/.test(form.studentNumber)) nextErrors.studentNumber = '학번을 숫자로 입력해주세요. (예: 2310)'
    if (!isRequired(form.school)) nextErrors.school = '학교를 입력해주세요.'
    if (!isRequired(String(form.age))) nextErrors.age = '나이를 입력해주세요.'
    else if (!Number.isInteger(Number(form.age)) || Number(form.age) <= 0) nextErrors.age = '올바른 나이를 입력해주세요.'
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
        email: state.email,
        password: state.password,
        name: state.name,
        school: form.school.trim(),
        age: Number(form.age),
        student_number: form.studentNumber,
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ general: '이미 가입된 이메일입니다. 돌아가기를 눌러 다른 이메일로 다시 시도해주세요.' })
      } else if (error.code === 'INVALID_STUDENT_NUMBER') {
        setErrors({ studentNumber: error.message })
      } else {
        setErrors({ general: error.message ?? '회원가입 중 오류가 발생했습니다.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    navigate('/signup', {
      state: { role: 'student', account: { email: state.email, name: state.name, password: state.password } },
    })
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

  return (
    <AuthLayout>
      <p className={styles.title}>학교 정보를 알려주세요</p>
      <p className={styles.subtitle}>학교와 학년에 맞는 직무 체험을 추천해드려요.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="학번"
          name="studentNumber"
          type="text"
          inputMode="numeric"
          placeholder="학번 (예: 2310)"
          value={form.studentNumber}
          onChange={handleChange}
          error={errors.studentNumber}
          icon={<UserIcon />}
          autoComplete="off"
        />
        <SchoolSearchField
          name="school"
          placeholder="학교명"
          value={form.school}
          onChange={handleChange}
          error={errors.school}
          icon={<CapIcon />}
        />
        <Input
          label="나이"
          name="age"
          type="number"
          placeholder="나이"
          value={form.age}
          onChange={handleChange}
          error={errors.age}
          icon={<CapIcon />}
        />
        <TermsCheckboxes value={terms} onChange={setTerms} error={errors.terms} />
        {errors.general && <p className={styles.roleError}>{errors.general}</p>}
        <button type="button" className={styles.backButton} onClick={handleBack}>
          돌아가기
        </button>
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '다음'}
        </Button>
      </form>
      <p className={styles.footer}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </AuthLayout>
  )
}
