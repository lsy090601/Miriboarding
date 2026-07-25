import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Select from '../../components/Select/Select.jsx'
import Button from '../../components/Button/Button.jsx'
import DuplicateCheckField from '../../components/DuplicateCheckField/DuplicateCheckField.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import { LockIcon, UserIcon, CapIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import { checkEmailExists } from '../../api/mockApi.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

const SCHOOL_OPTIONS = ['서울고등학교', '미리고등학교', '한빛고등학교', '기타']
const GRADE_OPTIONS = ['1학년', '2학년', '3학년']

export default function StudentSignupPage() {
  const { state } = useLocation()
  const [form, setForm] = useState({
    email: state?.email ?? '',
    password: state?.password ?? '',
    confirmPassword: state?.confirmPassword ?? '',
    name: state?.name ?? '',
    school: '',
    grade: '',
  })
  const [emailCheck, setEmailCheck] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false })
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

  function validate() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복 확인을 해주세요.'
    if (!isValidPassword(form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(form.password, form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    if (!isRequired(form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isRequired(form.school)) nextErrors.school = '학교를 선택해주세요.'
    if (!isRequired(form.grade)) nextErrors.grade = '학년을 선택해주세요.'
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
        grade: form.grade,
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: '이미 가입된 이메일입니다.' })
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
          <Link to="/login" className={styles.link}>
            로그인하러 가기
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <DuplicateCheckField
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="email"
          error={errors.email}
          status={emailCheck}
          checking={checkingEmail}
          onCheck={handleCheckEmail}
        />
        <div>
          <Input
            name="password"
            type="password"
            placeholder="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={form.password} />
        </div>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <Input
          name="name"
          type="text"
          placeholder="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          icon={<UserIcon />}
          autoComplete="name"
        />
        <Select
          name="school"
          value={form.school}
          onChange={handleChange}
          options={SCHOOL_OPTIONS}
          placeholder="학교를 선택하세요"
          error={errors.school}
          icon={<CapIcon />}
        />
        <Select
          name="grade"
          value={form.grade}
          onChange={handleChange}
          options={GRADE_OPTIONS}
          placeholder="학년을 선택하세요"
          error={errors.grade}
          icon={<CapIcon />}
        />
        <TermsCheckboxes value={terms} onChange={setTerms} error={errors.terms} />
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '가입하기'}
        </Button>
      </form>
    </AuthLayout>
  )
}
