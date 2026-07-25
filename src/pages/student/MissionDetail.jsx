import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getStoredAuth, MOCK_STUDENT_ID } from '../../lib/auth.js'
import { getOnboardingByCompanyId } from '../../mock/onboarding.js'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
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
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitFallback, setSubmitFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const studentId = getStoredAuth()?.userId ?? MOCK_STUDENT_ID
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
      <div className={styles.page}>
        <div className={styles.container}>불러오는 중...</div>
      </div>
    )
  }

  const mission = onboarding?.missions.find((m) => m.id === missionId)

  if (!onboarding || !mission) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button type="button" className={styles.backButton} onClick={() => navigate('/student/home')}>
            ← 뒤로가기
          </button>
          <p>존재하지 않는 미션이에요.</p>
        </div>
      </div>
    )
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setFileName(file.name)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)

    if (!isMock && enrollmentId) {
      try {
        await api.submitMission(enrollmentId, missionId, submissionForm.content || fileName || submissionForm.memo)
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}
        >
          ← 뒤로가기
        </button>

        {isMock && <FallbackBanner />}

        <h1 className={styles.title}>{mission.title}</h1>
        <p className={styles.description}>{mission.description}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mission.submissionType === 'text' && (
            <textarea
              className={styles.textarea}
              placeholder="내용을 작성해주세요"
              value={submissionForm.content}
              onChange={(e) => setSubmissionForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={6}
            />
          )}

          {mission.submissionType === 'choice' && (
            <div className={styles.choiceList}>
              {(mission.options ?? []).map((option) => (
                <label key={option} className={styles.choiceOption}>
                  <input
                    type="radio"
                    name="mission-choice"
                    value={option}
                    checked={submissionForm.content === option}
                    onChange={(e) => setSubmissionForm((prev) => ({ ...prev, content: e.target.value }))}
                  />
                  {option}
                </label>
              ))}
            </div>
          )}

          {mission.submissionType === 'file' && (
            <label
              className={`${styles.dropzone} ${isDraggingOver ? styles.dropzoneActive : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleFileDrop}
            >
              <input type="file" className={styles.fileInput} onChange={handleFileSelect} />
              <span className={styles.dropzoneIcon}>📎</span>
              <span>{fileName || '파일을 드래그하거나 클릭해서 선택하세요'}</span>
            </label>
          )}

          <textarea
            className={styles.memoTextarea}
            placeholder="메모 (선택)"
            value={submissionForm.memo}
            onChange={(e) => setSubmissionForm((prev) => ({ ...prev, memo: e.target.value }))}
            rows={3}
          />

          <button type="submit" className={styles.submitButton} disabled={isSubmitting || submitted}>
            {submitted ? '제출 완료' : isSubmitting ? '제출 중...' : '제출하기'}
          </button>

          <p className={styles.notice}>제출 후 회사가 검토합니다</p>

          {submitted && submitFallback && (
            <p className={styles.fallbackNotice}>⚠️ 서버 저장에 실패해서 화면에서만 표시 중이에요.</p>
          )}
          {submitted && !submitFallback && (
            <p className={styles.submittedMessage}>제출이 완료됐어요. 검토 결과를 기다려주세요.</p>
          )}
        </form>
      </div>
    </div>
  )
}
