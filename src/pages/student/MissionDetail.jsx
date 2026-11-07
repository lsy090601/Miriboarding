import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import useStudentOnboarding from '../../hooks/useStudentOnboarding.js'
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

  const { onboarding, enrollmentId, isLoading, loadError } = useStudentOnboarding(companyId)


  const [submissionForm, setSubmissionForm] = useState({ content: '', memo: '' })
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    setValidationError('')
  }, [submissionForm.content, fileName])

  useEffect(() => {
    setSubmissionForm({ content: '', memo: '' })
    setFileName('')
    setSelectedFile(null)
    setSubmitted(false)
    setSavedContent('')
    setSubmitError('')
  }, [companyId, missionId])

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
            <p role="alert">{loadError || '존재하지 않는 미션이에요.'}</p>
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
    if (isSubmitting) return
    const error = validateSubmission()
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    setSubmitError('')
    setIsSubmitting(true)

    if (enrollmentId) {
      try {
        let content = submissionForm.content || submissionForm.memo
        if (mission.submissionType === 'file' && selectedFile) {
          const uploaded = await api.uploadMissionFile(enrollmentId, missionId, selectedFile)
          content = uploaded.url
        }
        await api.submitMission(enrollmentId, missionId, content)
        setSavedContent(content)
        setSubmitted(true)
        return
      } catch (error) {
        setSubmitError(error.message || '제출에 실패했습니다. 입력 내용을 확인하고 다시 시도해주세요.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setSubmitError('등록 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const isDone = (mission.completed || submitted)

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}>
            ← 뒤로가기
          </Button>


          <h1 className={styles.title}>{mission.title}</h1>
          <p className={styles.description}>{mission.description}</p>

          {isDone ? (
            <div className={styles.submittedSection}>
              <div className={styles.submittedBox}>
                <p className={styles.submittedLabel}>제출한 내용</p>
                {mission.submissionType === 'file' && (savedContent || mission.submittedContent) ? (
                  <a
                    href={savedContent || mission.submittedContent}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.submittedFileLink}
                  >
                    제출한 파일 보기
                  </a>
                ) : (
                  <p className={styles.submittedContent}>{savedContent || mission.submittedContent || '-'}</p>
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

            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {submitError && <p role="alert">{submitError} 다시 제출할 수 있습니다.</p>}
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
