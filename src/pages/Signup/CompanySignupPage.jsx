import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Select from '../../components/Select/Select.jsx'
import Button from '../../components/Button/Button.jsx'
import Banner from '../../components/Banner/Banner.jsx'
import TermsCheckboxes from '../../components/TermsCheckboxes/TermsCheckboxes.jsx'
import ReadOnlyField from '../../components/ReadOnlyField/ReadOnlyField.jsx'
import { PencilIcon, PhoneIcon } from '../../components/icons/Icons.jsx'
import { isRequired, isValidPhone } from '../../utils/validation.js'
import { formatBizNumber } from '../../utils/format.js'
import * as api from '../../lib/api.js'
import styles from './SignupForm.module.css'

const POSITION_OPTIONS = ['사원', '주임', '대리', '과장', '차장', '부장', '이사', '대표']

// 기업 가입 흐름: 계정 정보(역할 선택 화면에서 입력) → 사업자 확인 → 회사 정보 확인 → 담당자 정보
// 이메일·이름·비밀번호는 앞의 계정 정보 화면에서 이미 받았으므로 여기서는 다시 입력받지 않는다.
export default function CompanySignupPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const step = searchParams.get('step') === '2' ? 2 : 1
  const { state } = useLocation()
  // setSearchParams로 주소가 바뀌면 location.state가 비므로, 처음 받은 계정 정보를 따로 보관한다.
  const [account] = useState(() => state ?? null)

  const [bizNumber, setBizNumber] = useState('')
  const [lookupCompanyName, setLookupCompanyName] = useState('')
  const [verification, setVerification] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [bizError, setBizError] = useState('')
  const [companyInfo, setCompanyInfo] = useState({ companyName: '', industry: '', foundedAt: '' })

  const [contactForm, setContactForm] = useState({ position: '', companyPhone: '' })
  const [terms, setTerms] = useState({ tos: false, privacy: false, age: false, marketing: false })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (step === 2 && verification?.status !== 'verified') {
      setSearchParams({ step: '1' })
    }
  }, [step, verification, setSearchParams])

  // 계정 정보 화면을 거치지 않고 주소로 바로 들어온 경우
  if (!account?.email) return <Navigate to="/signup" replace />

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
      const result = await api.validateBusiness(bizNumber, lookupCompanyName.trim())
      if (result.valid) {
        setVerification({ status: 'verified' })
        setCompanyInfo({
          companyName: result.company_name,
          industry: result.industry,
          foundedAt: result.founded_date,
        })
      } else {
        setVerification({ status: 'invalid' })
        setBizError(result.message ?? '사업자 번호 형식을 확인해주세요. (예: 123-45-67890)')
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
  }

  function validateContactForm() {
    const nextErrors = {}
    if (!isRequired(contactForm.position)) nextErrors.position = '직급을 선택해주세요.'
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
        email: account.email,
        password: account.password,
        businessNumber: bizNumber,
        company_name: companyInfo.companyName,
        industry: companyInfo.industry,
        founded_date: companyInfo.foundedAt,
        contact_name: account.name,
        contact_position: contactForm.position,
        contact_phone: contactForm.companyPhone,
      })
      setSubmitted(true)
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN') {
        setErrors({ email: '이미 가입된 이메일입니다. 처음 화면에서 다른 이메일로 다시 가입해주세요.' })
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

  // 사업자 검증 전
  if (step === 1 && verification?.status !== 'verified') {
    return (
      <AuthLayout>
        <p className={styles.title}>사업자등록번호를 확인할게요</p>
        <p className={styles.subtitle}>국민연금 가입 사업장 정보에서 회사명과 업종을 조회합니다.</p>
        <form className={styles.form} onSubmit={handleVerify}>
          <div>
            <label className={styles.fieldLabel} htmlFor="lookupCompanyName">등록된 회사명</label>
            <Input id="lookupCompanyName" name="lookupCompanyName" value={lookupCompanyName} placeholder="예: 삼성전자" onChange={(e) => { setLookupCompanyName(e.target.value); setVerification(null); setBizError(''); }} />
          </div>
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
              <Button type="submit" variant="primary" className={styles.verifyButton} disabled={verifying || !lookupCompanyName.trim()}>
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

  // 사업자 검증 성공 (회사 정보 확인)
  if (step === 1 && verification?.status === 'verified') {
    return (
      <AuthLayout>
        <div className={styles.form}>
          <Banner variant="success">사업장 정보를 불러왔습니다.</Banner>
        </div>
        <p className={styles.title} style={{ marginTop: 26 }}>
          회사 정보를 확인해주세요
        </p>
        <p className={styles.subtitle}>국민연금 사업장 정보입니다. 번호 앞 6자리와 회사명으로 조회하므로 회사 정보가 일치하는지 확인해주세요.</p>
        <div className={styles.sectionGroup}>
          <ReadOnlyField label="회사명" value={companyInfo.companyName} />
          <ReadOnlyField label="업종" value={companyInfo.industry} />
          <ReadOnlyField label="국민연금 사업장 등록일" value={companyInfo.foundedAt} />
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

  // 담당자 정보
  return (
    <AuthLayout>
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
        {errors.email && <p className={styles.roleError}>{errors.email}</p>}
        {errors.general && <p className={styles.roleError}>{errors.general}</p>}
        <button type="button" className={styles.backButton} onClick={() => setSearchParams({ step: '1' })}>
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
