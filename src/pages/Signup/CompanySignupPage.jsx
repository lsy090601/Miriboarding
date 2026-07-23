import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import RoleToggle from '../../components/RoleToggle/RoleToggle.jsx'
import { MailIcon, LockIcon, UserIcon, PencilIcon, PhoneIcon, CapIcon } from '../../components/icons/Icons.jsx'
import {
  isValidEmail,
  isValidPassword,
  doPasswordsMatch,
  isRequired,
  isValidBizNumber,
  isValidPhone,
} from '../../utils/validation.js'
import { verifyBusinessNumber } from '../../api/mockApi.js'
import styles from './SignupForm.module.css'

export default function CompanySignupPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [step, setStep] = useState(1)
  const [step1Form, setStep1Form] = useState({
    email: state?.email ?? '',
    name: state?.name ?? '',
    password: state?.password ?? '',
    confirmPassword: state?.confirmPassword ?? '',
  })
  const [bizNumber, setBizNumber] = useState('')
  const [companyForm, setCompanyForm] = useState({ companyName: '', industry: '', foundedAt: '' })
  const [contactForm, setContactForm] = useState({ contactName: '', position: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [verifying, setVerifying] = useState(false)

  function handleStep1Change(e) {
    const { name, value } = e.target
    setStep1Form((prev) => ({ ...prev, [name]: value }))
  }

  function handleCompanyChange(e) {
    const { name, value } = e.target
    setCompanyForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleContactChange(e) {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  function validateStep1() {
    const nextErrors = {}
    if (!isRequired(step1Form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(step1Form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    if (!isRequired(step1Form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isValidPassword(step1Form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(step1Form.password, step1Form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleStep1Next(e) {
    e.preventDefault()
    if (!validateStep1()) return
    setErrors({})
    setStep(2)
  }

  function handleVerifyBizNumber(e) {
    e.preventDefault()
    if (!isValidBizNumber(bizNumber)) {
      setErrors({ bizNumber: '사업자 번호 형식을 확인해주세요. (예: 123-45-67890)' })
      return
    }
    setErrors({})
    setVerifying(true)
    verifyBusinessNumber(bizNumber)
      .then(() => {
        setVerifying(false)
        setErrors({})
        setStep(3)
      })
      .catch((err) => {
        setVerifying(false)
        setErrors({ bizNumber: err.message })
      })
  }

  function validateCompanyForm() {
    const nextErrors = {}
    if (!isRequired(companyForm.companyName)) nextErrors.companyName = '회사명을 입력해주세요.'
    if (!isRequired(companyForm.industry)) nextErrors.industry = '업종을 입력해주세요.'
    if (!isRequired(companyForm.foundedAt)) nextErrors.foundedAt = '설립일을 입력해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleCompanyNext(e) {
    e.preventDefault()
    if (!validateCompanyForm()) return
    setErrors({})
    setStep(4)
  }

  function validateContactForm() {
    const nextErrors = {}
    if (!isRequired(contactForm.contactName)) nextErrors.contactName = '담당자명을 입력해주세요.'
    if (!isRequired(contactForm.position)) nextErrors.position = '직급을 입력해주세요.'
    if (!isValidPhone(contactForm.phone)) nextErrors.phone = '전화번호 형식을 확인해주세요. (예: 010-1234-5678)'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validateContactForm()) return
    console.log('company signup complete', { ...step1Form, bizNumber, ...companyForm, ...contactForm })
    navigate('/login')
  }

  function handleSwitchRole(nextRole) {
    if (nextRole === 'student') {
      navigate('/signup/student', { state: step1Form })
    }
  }

  if (step === 1) {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={handleStep1Next}>
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
            name="name"
            type="text"
            placeholder="name"
            value={step1Form.name}
            onChange={handleStep1Change}
            error={errors.name}
            icon={<UserIcon />}
            autoComplete="name"
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
          <RoleToggle value="company" onChange={handleSwitchRole} />
          <Button type="submit" variant="primary" className={styles.submit}>
            next
          </Button>
        </form>
      </AuthLayout>
    )
  }

  if (step === 2) {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={handleVerifyBizNumber}>
          <button type="button" className={styles.backLink} onClick={() => setStep(1)}>
            ← back
          </button>
          <Input
            name="bizNumber"
            type="text"
            placeholder="사업자 번호 입력(123-45-67890)"
            value={bizNumber}
            onChange={(e) => setBizNumber(e.target.value)}
            error={errors.bizNumber}
            icon={<PencilIcon />}
          />
          <Button type="submit" variant="primary" className={styles.submit} disabled={verifying}>
            {verifying ? 'verifying...' : 'next'}
          </Button>
        </form>
      </AuthLayout>
    )
  }

  if (step === 3) {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={handleCompanyNext}>
          <button type="button" className={styles.backLink} onClick={() => setStep(2)}>
            ← back
          </button>
          <p className={styles.successText}>검증 성공!</p>
          <Input
            name="companyName"
            type="text"
            placeholder="회사명"
            value={companyForm.companyName}
            onChange={handleCompanyChange}
            error={errors.companyName}
            icon={<PencilIcon />}
          />
          <Input
            name="industry"
            type="text"
            placeholder="업종"
            value={companyForm.industry}
            onChange={handleCompanyChange}
            error={errors.industry}
            icon={<PencilIcon />}
          />
          <Input
            name="foundedAt"
            type="text"
            placeholder="설립일"
            value={companyForm.foundedAt}
            onChange={handleCompanyChange}
            error={errors.foundedAt}
            icon={<PencilIcon />}
          />
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
        <button type="button" className={styles.backLink} onClick={() => setStep(3)}>
          ← back
        </button>
        <Input
          name="contactName"
          type="text"
          placeholder="담당자명"
          value={contactForm.contactName}
          onChange={handleContactChange}
          error={errors.contactName}
          icon={<UserIcon />}
        />
        <Input
          name="position"
          type="text"
          placeholder="직급"
          value={contactForm.position}
          onChange={handleContactChange}
          error={errors.position}
          icon={<CapIcon />}
        />
        <Input
          name="phone"
          type="tel"
          placeholder="전화번호"
          value={contactForm.phone}
          onChange={handleContactChange}
          error={errors.phone}
          icon={<PhoneIcon />}
          inputMode="tel"
        />
        <Button type="submit" variant="primary" className={styles.submit}>
          create an account
        </Button>
      </form>
    </AuthLayout>
  )
}
