import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import RoleToggle from '../../components/RoleToggle/RoleToggle.jsx'
import { MailIcon, LockIcon, UserIcon, CapIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import styles from './SignupForm.module.css'

export default function StudentSignupPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [step, setStep] = useState(1)
  const [step1Form, setStep1Form] = useState({
    email: state?.email ?? '',
    id: '',
    password: state?.password ?? '',
    confirmPassword: state?.confirmPassword ?? '',
  })
  const [step2Form, setStep2Form] = useState({ name: state?.name ?? '', school: '', grade: '' })
  const [errors, setErrors] = useState({})

  function handleStep1Change(e) {
    const { name, value } = e.target
    setStep1Form((prev) => ({ ...prev, [name]: value }))
  }

  function handleStep2Change(e) {
    const { name, value } = e.target
    setStep2Form((prev) => ({ ...prev, [name]: value }))
  }

  function validateStep1() {
    const nextErrors = {}
    if (!isRequired(step1Form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(step1Form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    if (!isRequired(step1Form.id)) nextErrors.id = '아이디를 입력해주세요.'
    if (!isValidPassword(step1Form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(step1Form.password, step1Form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateStep2() {
    const nextErrors = {}
    if (!isRequired(step2Form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isRequired(step2Form.school)) nextErrors.school = '학교명을 입력해주세요.'
    if (!isRequired(step2Form.grade)) nextErrors.grade = '학년을 입력해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleNext(e) {
    e.preventDefault()
    if (!validateStep1()) return
    setErrors({})
    setStep(2)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validateStep2()) return
    console.log('student signup complete', { ...step1Form, ...step2Form })
    navigate('/login')
  }

  function handleSwitchRole(nextRole) {
    if (nextRole === 'company') {
      navigate('/signup/company', { state: step1Form })
    }
  }

  if (step === 1) {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={handleNext}>
          <Input
            name="email"
            type="email"
            placeholder="email"
            value={step1Form.email}
            onChange={handleStep1Change}
            error={errors.email}
            icon={<MailIcon />}
            autoComplete="email"
          />
          <Input
            name="id"
            type="text"
            placeholder="id"
            value={step1Form.id}
            onChange={handleStep1Change}
            error={errors.id}
            icon={<UserIcon />}
            autoComplete="username"
          />
          <Input
            name="password"
            type="password"
            placeholder="password"
            value={step1Form.password}
            onChange={handleStep1Change}
            error={errors.password}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <Input
            name="confirmPassword"
            type="password"
            placeholder="re-enter password"
            value={step1Form.confirmPassword}
            onChange={handleStep1Change}
            error={errors.confirmPassword}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <RoleToggle value="student" onChange={handleSwitchRole} />
          <Button type="submit" variant="primary" className={styles.submit}>
            next
          </Button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <button type="button" className={styles.backLink} onClick={() => setStep(1)}>
          ← back
        </button>
        <Input
          name="name"
          type="text"
          placeholder="name"
          value={step2Form.name}
          onChange={handleStep2Change}
          error={errors.name}
          icon={<UserIcon />}
          autoComplete="name"
        />
        <Input
          name="school"
          type="text"
          placeholder="school name"
          value={step2Form.school}
          onChange={handleStep2Change}
          error={errors.school}
          icon={<CapIcon />}
          autoComplete="organization"
        />
        <Input
          name="grade"
          type="text"
          placeholder="grade"
          value={step2Form.grade}
          onChange={handleStep2Change}
          error={errors.grade}
          icon={<CapIcon />}
        />
        <Button type="submit" variant="primary" className={styles.submit}>
          create an account
        </Button>
      </form>
    </AuthLayout>
  )
}
