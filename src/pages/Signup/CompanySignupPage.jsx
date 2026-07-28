import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Select from '../../components/Select/Select.jsx'
import Button from '../../components/Button/Button.jsx'
import Stepper from '../../components/Stepper/Stepper.jsx'
import Banner from '../../components/Banner/Banner.jsx'
import DuplicateCheckField from '../../components/DuplicateCheckField/DuplicateCheckField.jsx'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import ReadOnlyField from '../../components/ReadOnlyField/ReadOnlyField.jsx'
import { MailIcon, LockIcon, UserIcon, PencilIcon, PhoneIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired, isValidPhone } from '../../utils/validation.js'
import { formatBizNumber } from '../../utils/format.js'
import { checkEmailExists } from '../../api/mockApi.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

const POSITION_OPTIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '대표']

export default function CompanySignupPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step') === '2' ? 2 : 1
  const { state } = useLocation()

  const [bizNumber, setBizNumber] = useState('')
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [bizError, setBizError] = useState('')
  const [companyInfo, setCompanyInfo] = useState({ companyName: '', industry: '', foundedAt: '' })

  // step=2 화면을 "계정 정보"/"담당자 정보" 두 화면으로 나누기 위한 로컬 상태입니다.
  // URL의 step 파라미터, validateContactForm/handleSubmit 로직은 기존과 동일합니다.
  const [contactSubStep, setContactSubStep] = useState(1)

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
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false, marketing: false })
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
    setCompanyInfo({ companyName: '', industry: '', foundedAt: '' })
    setBizError('')
  }

  async function handleVerify(e) {
    e.preventDefault()
    setVerifying(true)
    setBizError('')
    try {
      const result = await api.validateBusiness(bizNumber)
      if (result.valid) {
        setVerification({ status: 'verified' })
        setCompanyInfo({
          companyName: result.company_name,
          industry: result.industry,
          foundedAt: result.founded_date,
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
    setContactSubStep(1)
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

  function handleAccountNext() {
    const nextErrors = {}
    if (!isRequired(contactForm.contactName)) nextErrors.contactName = '담당자명을 입력해주세요.'
    if (!isRequired(contactForm.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(contactForm.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    else if (emailCheck !== 'available') nextErrors.email = '이메일 중복 확인을 해주세요.'
    if (!isValidPassword(contactForm.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(contactForm.password, contactForm.confirmPassword))
      nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setContactSubStep(2)
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
        company_name: companyInfo.companyName,
        industry: companyInfo.industry,
        founded_date: companyInfo.foundedAt,
        contact_name: contactForm.contactName,
        contact_position: contactForm.position,
        contact_phone: contactForm.companyPhone,
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: '이미 가입된 이메일입니다.' })
        setContactSubStep(1)
      } else if (error.code === 'BUSINESS_NUMBER_TAKEN') {
        setVerification(null)
        setBizError('이미 가입된 사업자등록번호입니다. 다른 사업자번호로 시도해주세요.')
        setSearchParams({ step: '1' })
      } else {
        setErrors({ general: error.message ?? '회원가입 중 오류가 발생했습니다.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const footer = (
    <p className={styles.footer}>
      이미 계정이 있으신가요? <Link to="/login">로그인</Link>
    </p>
  )

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

  // 화면 1/4 · 사업자 검증 전
  if (step === 1 && verification?.status !== 'verified') {
    return (
      <AuthLayout>
        <div className={styles.stepperRow}>
          <Stepper current={1} total={4} label="사업자 검증" />
        </div>
        <p className={styles.title}>사업자등록번호를 확인할게요</p>
        <p className={styles.subtitle}>국세청에 등록된 정보로 회사를 자동으로 불러옵니다.</p>
        <form className={styles.form} onSubmit={handleVerify}>
          <div>
            <label className={styles.fieldLabel} htmlFor="bizNumber">
              사업자등록번호
            </label>
            <div className={styles.bizRow}>
              <Input
                id="bizNumber"
                name="bizNumber"
                type="text"
                placeholder="123-45-67890"
                value={bizNumber}
                onChange={handleBizNumberChange}
                error={bizError}
                icon={<PencilIcon />}
              />
              <Button type="submit" variant="primary" className={styles.verifyButton} disabled={verifying}>
                {verifying ? '확인 중...' : '검증하기'}
              </Button>
            </div>
          </div>
          <p className={styles.hint}>숫자 10자리를 입력하면 자동으로 형식이 맞춰집니다.</p>
          <Button type="button" variant="outline" className={styles.submit} disabled>
            다음
          </Button>
        </form>
        {footer}
      </AuthLayout>
    )
  }

  // 화면 2/4 · 사업자 검증 성공 (회사 정보 확인)
  if (step === 1 && verification?.status === 'verified') {
    return (
      <AuthLayout>
        <div className={styles.stepperRow}>
          <Stepper current={2} total={4} label="회사 정보 확인" />
        </div>
        <div className={styles.form}>
          <Banner variant="success">검증 성공! 회사 정보를 불러왔습니다.</Banner>
        </div>
        <p className={styles.title} style={{ marginTop: 26 }}>
          회사 정보를 확인해주세요
        </p>
        <p className={styles.subtitle}>국세청에 등록된 정보입니다. 다르면 이전 단계에서 다시 조회해주세요.</p>
        <div className={styles.sectionGroup}>
          <ReadOnlyField label="회사명" value={companyInfo.companyName} />
          <ReadOnlyField label="업종" value={companyInfo.industry} />
          <ReadOnlyField label="설립일" value={companyInfo.foundedAt} />
          <Button type="button" variant="primary" className={styles.submit} onClick={handleGoToStep2}>
            다음
          </Button>
          <button type="button" className={styles.centerLink} onClick={() => setVerification(null)}>
            이전 단계로 돌아가기
          </button>
        </div>
      </AuthLayout>
    )
  }

  // 화면 3/4 · 계정 정보
  if (contactSubStep === 1) {
    return (
      <AuthLayout>
        <div className={styles.stepperRow}>
          <Stepper current={3} total={4} label="계정 정보" />
        </div>
        <p className={styles.title}>계정 정보를 입력해주세요</p>
        <p className={styles.subtitle}>로그인에 사용할 이메일과 비밀번호를 설정합니다.</p>
        <div className={styles.form}>
          <DuplicateCheckField
            label="이메일"
            icon={<MailIcon />}
            name="email"
            value={contactForm.email}
            onChange={handleContactChange}
            placeholder="company@example.com"
            error={errors.email}
            status={emailCheck}
            checking={checkingEmail}
            onCheck={handleCheckEmail}
          />
          <Input
            label="담당자명"
            name="contactName"
            type="text"
            placeholder="실명을 입력해주세요"
            value={contactForm.contactName}
            onChange={handleContactChange}
            error={errors.contactName}
            icon={<UserIcon />}
          />
          <div>
            <Input
              label="비밀번호"
              name="password"
              type="password"
              placeholder="8자 이상, 영문·숫자 조합"
              value={contactForm.password}
              onChange={handleContactChange}
              error={errors.password}
              icon={<LockIcon />}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={contactForm.password} />
          </div>
          <Input
            label="비밀번호 확인"
            name="confirmPassword"
            type="password"
            placeholder="비밀번호를 한 번 더 입력해주세요"
            value={contactForm.confirmPassword}
            onChange={handleContactChange}
            error={errors.confirmPassword}
            icon={<LockIcon />}
            autoComplete="new-password"
          />
          <button type="button" className={styles.backButton} onClick={() => setSearchParams({ step: '1' })}>
            ← 이전
          </button>
          <Button type="button" variant="primary" className={styles.submit} onClick={handleAccountNext}>
            다음
          </Button>
        </div>
        {footer}
      </AuthLayout>
    )
  }

  // 화면 4/4 · 담당자 정보
  return (
    <AuthLayout>
      <div className={styles.stepperRow}>
        <Stepper current={4} total={4} label="담당자 정보" />
      </div>
      <p className={styles.title}>담당자 정보를 입력해주세요</p>
      <p className={styles.subtitle}>온보딩을 관리하고 학생과 소통할 담당자 정보입니다.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Select
          label="직급"
          name="position"
          value={contactForm.position}
          onChange={handleContactChange}
          options={POSITION_OPTIONS}
          placeholder="직급을 선택해주세요"
          error={errors.position}
        />
        <Input
          label="회사 연락처"
          name="companyPhone"
          type="tel"
          placeholder="02-1234-5678"
          value={contactForm.companyPhone}
          onChange={handleContactChange}
          error={errors.companyPhone}
          icon={<PhoneIcon />}
        />
        <TermsCheckboxes value={terms} onChange={setTerms} error={errors.terms} />
        {errors.general && <p className={styles.roleError}>{errors.general}</p>}
        <button type="button" className={styles.backButton} onClick={() => setContactSubStep(1)}>
          ← 이전
        </button>
        <Button type="submit" variant="primary" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? '가입 처리 중...' : '가입 완료하기'}
        </Button>
      </form>
      {footer}
    </AuthLayout>
  )
}
