import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId } from '../../mock/onboarding.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import Input from '../../components/Input/Input.jsx'
import Radio from '../../components/Radio/Radio.jsx'
import Dropzone from '../../components/Dropzone/Dropzone.jsx'
import styles from './MissionDetail.module.css'

export default function MissionDetail() {
  const { companyId, missionId } = useParams()
  const navigate = useNavigate()

  const [onboarding, setOnboarding] = useState(null)
  const [enrollmentId, setEnrollmentId] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [submissionForm, setSubmissionForm] = useState({ content: '', memo: '' })
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitFallback, setSubmitFallback] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setValidationError('')
  }, [submissionForm.content, fileName])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const studentId = getCurrentStudentId()
      try {
        const enrollment = await api.enrollStudent(companyId, studentId)
        const data = await api.getOnboarding(companyId)
        const { submissions } = await api.listSubmissions(enrollment.enrollmentId)
        if (cancelled) return
        setEnrollmentId(enrollment.enrollmentId)
        setOnboarding(api.normalizeOnboardingResponse(companyId, data, submissions))
        setIsMock(false)
      } catch (error) {
        console.error('온보딩 API 연동 실패, mock으로 폴백합니다:', error)
        if (cancelled) return
        setOnboarding(getOnboardingByCompanyId(companyId))
        setIsMock(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (isLoading) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>불러오는 중...</div>
        </div>
      </>
    )
  }

  const mission = onboarding?.missions.find((m) => m.id === missionId)

  if (!onboarding || !mission) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/home')}>
              ← 뒤로가기
            </Button>
            <p>존재하지 않는 미션이에요.</p>
          </div>
        </div>
      </>
    )
  }

  function handleFileChange(file) {
    setFileName(file.name)
    setSelectedFile(file)
  }

  function validateSubmission() {
    if (mission.submissionType === 'text' && !submissionForm.content.trim()) {
      return '내용을 입력해주세요.'
    }
    if (mission.submissionType === 'choice' && !submissionForm.content) {
      return '선택지를 골라주세요.'
    }
    if (mission.submissionType === 'file' && !fileName) {
      return '파일을 선택해주세요.'
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const error = validateSubmission()
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    setIsSubmitting(true)

    if (!isMock && enrollmentId) {
      try {
        let content = submissionForm.content || submissionForm.memo
        if (mission.submissionType === 'file' && selectedFile) {
          const uploaded = await api.uploadMissionFile(enrollmentId, missionId, selectedFile)
          content = uploaded.url
        }
        await api.submitMission(enrollmentId, missionId, content)
        setIsSubmitting(false)
        setSubmitted(true)
        return
      } catch (error) {
        console.error('미션 제출 API 실패, 로컬 시뮬레이션으로 폴백합니다:', error)
        setSubmitFallback(true)
      }
    }

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  const isDone = !isMock && (mission.completed || submitted)

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}>
            ← 뒤로가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <h1 className={styles.title}>{mission.title}</h1>
          <p className={styles.description}>{mission.description}</p>

          {isDone ? (
            <div className={styles.submittedSection}>
              <div className={styles.submittedBox}>
                <p className={styles.submittedLabel}>제출한 내용</p>
                {mission.submissionType === 'file' && mission.submittedContent ? (
                  <a
                    href={mission.submittedContent}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.submittedFileLink}
                  >
                    제출한 파일 보기
                  </a>
                ) : (
                  <p className={styles.submittedContent}>{mission.submittedContent || '-'}</p>
                )}
              </div>

              {mission.feedback ? (
                <div className={styles.feedbackBox}>
                  <p className={styles.feedbackLabel}>회사 피드백</p>
                  <p className={styles.feedbackText}>{mission.feedback}</p>
                </div>
              ) : (
                <Banner variant="success">제출이 완료됐어요. 회사의 피드백을 기다려주세요.</Banner>
              )}

              {submitted && submitFallback && (
                <Banner variant="warning">서버 저장에 실패해서 화면에서만 표시 중이에요.</Banner>
              )}
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {mission.submissionType === 'text' && (
                <Input
                  multiline
                  rows={6}
                  label="제출 내용"
                  placeholder="내용을 작성해주세요"
                  value={submissionForm.content}
                  onChange={(e) => setSubmissionForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              )}

              {mission.submissionType === 'choice' && (
                <div className={styles.choiceList}>
                  {(mission.options ?? []).map((option) => (
                    <Radio
                      key={option}
                      id={`choice-${option}`}
                      name="mission-choice"
                      value={option}
                      checked={submissionForm.content === option}
                      onChange={(e) => setSubmissionForm((prev) => ({ ...prev, content: e.target.value }))}
                    >
                      {option}
                    </Radio>
                  ))}
                </div>
              )}

              {mission.submissionType === 'file' && <Dropzone fileName={fileName} onChange={handleFileChange} />}

              <Input
                multiline
                rows={3}
                label="메모 (선택)"
                placeholder="메모를 남겨보세요"
                value={submissionForm.memo}
                onChange={(e) => setSubmissionForm((prev) => ({ ...prev, memo: e.target.value }))}
              />

              {validationError && <p className={styles.validationError}>{validationError}</p>}

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? '제출 중...' : '제출하기'}
              </Button>

              <p className={styles.notice}>제출 후 회사가 검토합니다</p>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
