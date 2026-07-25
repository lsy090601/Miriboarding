import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Select from '../../components/Select/Select.jsx'
import Button from '../../components/Button/Button.jsx'
import DuplicateCheckField from '../../components/DuplicateCheckField/DuplicateCheckField.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import VerificationBadge from '../../components/VerificationBadge/VerificationBadge.jsx'
import ReadOnlyField from '../../components/ReadOnlyField/ReadOnlyField.jsx'
import { LockIcon, UserIcon, PencilIcon, PhoneIcon, CapIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired, isValidPhone } from '../../utils/validation.js'
import { formatBizNumber } from '../../utils/format.js'
import { checkEmailExists } from '../../api/mockApi.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

const POSITION_OPTIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '대표']

export default function CompanySignupPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step') === '2' ? 2 : 1
  const navigate = useNavigate()
  const { state } = useLocation()

  const [bizNumber, setBizNumber] = useState('')
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [bizError, setBizError] = useState('')

  const [contactForm, setContactForm] = useState({
    contactName: state?.name ?? '',
    position: '',
    email: state?.email ?? '',
    password: state?.password ?? '',
    confirmPassword: state?.confirmPassword ?? '',
    companyPhone: '',
  })
  const [emailCheck, setEmailCheck] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (step === 2 && verification?.status !== 'verified') {
      setSearchParams({ step: '1' })
    }
  }, [step, verification, setSearchParams])

  function handleBizNumberChange(e) {
    setBizNumber(formatBizNumber(e.target.value))
    setVerification(null)
    setBizError('')
  }

  async function handleVerify(e) {
    e.preventDefault()
    setVerifying(true)
    setBizError('')
    try {
      const result = await api.validateBusiness(bizNumber)
      if (result.valid) {
        setVerification({
          status: 'verified',
          company: {
            companyName: result.company_name,
            industry: result.industry,
            foundedAt: result.founded_date,
          },
        })
      } else {
        setVerification({ status: 'invalid' })
        setBizError('사업자 번호 형식을 확인해주세요. (예: 123-45-67890)')
      }
    } catch (error) {
      setVerification({ status: 'invalid' })
      setBizError(error.message ?? '사업자 번호 검증 중 오류가 발생했습니다.')
    } finally {
      setVerifying(false)
    }
  }

  function handleGoToStep2() {
    if (verification?.status !== 'verified') return
    setSearchParams({ step: '2' })
  }

  function handleContactChange(e) {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailCheck(null)
  }

  async function handleCheckEmail() {
    if (!isValidEmail(contactForm.email)) {
      setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }))
      return
    }
    setCheckingEmail(true)
    const result = await checkEmailExists(contactForm.email)
    setCheckingEmail(false)
    setEmailCheck(result.exists ? 'taken' : 'available')
  }

  function validateContactForm() {
    const nextErrors = {}
    if (!isRequired(contactForm.contactName)) nextErrors.contactName = '담당자명을 입력해주세요.'
    if (!isRequired(contactForm.position)) nextErrors.position = '직급을 선택해주세요.'
    if (!isRequired(contactForm.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(contactForm.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복 확인을 해주세요.'
    if (!isValidPassword(contactForm.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(contactForm.password, contactForm.confirmPassword))
      nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    if (contactForm.companyPhone && !isValidPhone(contactForm.companyPhone))
      nextErrors.companyPhone = '전화번호 형식을 확인해주세요. (예: 02-1234-5678)'
    if (!terms.tos || !terms.privacy || !terms.age) nextErrors.terms = '약관에 모두 동의해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateContactForm()) return
    setIsSubmitting(true)
    try {
      await api.signupCompany({
        email: contactForm.email,
        password: contactForm.password,
        businessNumber: bizNumber,
        company_name: verification?.company?.companyName,
        industry: verification?.company?.industry,
        founded_date: verification?.company?.foundedAt,
        contact_name: contactForm.contactName,
        contact_position: contactForm.position,
        contact_phone: contactForm.companyPhone,
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: '이미 가입된 이메일입니다.' })
      } else {
        setErrors({ companyPhone: error.message ?? '회원가입 중 오류가 발생했습니다.' })
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

  if (step === 1) {
    return (
      <AuthLayout>
        <form className={styles.form} onSubmit={handleVerify}>
          <div>
            <div className={styles.row}>
              <Input
                name="bizNumber"
                type="text"
                placeholder="사업자 번호 입력(123-45-67890)"
                value={bizNumber}
                onChange={handleBizNumberChange}
                error={bizError}
                icon={<PencilIcon />}
              />
              <Button type="submit" variant="outline" className={styles.checkButton} disabled={verifying}>
                {verifying ? '확인 중...' : '검증'}
              </Button>
            </div>
            {verification?.status && (
              <div className={styles.badgeRow}>
                <VerificationBadge status={verification.status} />
              </div>
            )}
          </div>

          {verification?.status === 'verified' && (
            <div className={styles.sectionGroup}>
              <ReadOnlyField label="회사명" value={verification.company.companyName} icon={<PencilIcon />} />
              <ReadOnlyField label="업종" value={verification.company.industry} icon={<PencilIcon />} />
              <ReadOnlyField label="설립일" value={verification.company.foundedAt} icon={<PencilIcon />} />
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            className={styles.submit}
            disabled={verification?.status !== 'verified'}
            onClick={handleGoToStep2}
          >
            다음 단계로
          </Button>
          <button type="button" className={styles.backLink} onClick={() => navigate('/signup')}>
            ← 이전
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.sectionGroup}>
          <ReadOnlyField label="회사명" value={verification?.company?.companyName} icon={<PencilIcon />} />
          <ReadOnlyField label="업종" value={verification?.company?.industry} icon={<PencilIcon />} />
          <ReadOnlyField label="설립일" value={verification?.company?.foundedAt} icon={<PencilIcon />} />
        </div>
        <Input
          name="contactName"
          type="text"
          placeholder="담당자명"
          value={contactForm.contactName}
          onChange={handleContactChange}
          error={errors.contactName}
          icon={<UserIcon />}
        />
        <Select
          name="position"
          value={contactForm.position}
          onChange={handleContactChange}
          options={POSITION_OPTIONS}
          placeholder="직급을 선택하세요"
          error={errors.position}
          icon={<CapIcon />}
        />
        <DuplicateCheckField
          name="email"
          value={contactForm.email}
          onChange={handleContactChange}
          placeholder="담당자 이메일"
          error={errors.email}
          status={emailCheck}
          checking={checkingEmail}
          onCheck={handleCheckEmail}
        />
        <div>
          <Input
            name="password"
            type="password"
            placeholder="비밀번호"
            value={contactForm.password}
            onChange={handleContactChange}
            error={errors.password}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={contactForm.password} />
        </div>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="비밀번호 확인"
          value={contactForm.confirmPassword}
          onChange={handleContactChange}
          error={errors.confirmPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <Input
          name="companyPhone"
          type="tel"
          placeholder="회사 연락처 (선택)"
          value={contactForm.companyPhone}
          onChange={handleContactChange}
          error={errors.companyPhone}
          icon={<PhoneIcon />}
        />
        <TermsCheckboxes value={terms} onChange={setTerms} error={errors.terms} />
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '가입 완료하기'}
        </Button>
        <button type="button" className={styles.backLink} onClick={() => setSearchParams({ step: '1' })}>
          ← 이전
        </button>
      </form>
    </AuthLayout>
  )
}
