import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId, getMissionProgress, SUBMISSION_TYPE_LABEL } from '../../mock/onboarding.js'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import styles from './MissionList.module.css'

export default function MissionList() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const [onboarding, setOnboarding] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const studentId = getCurrentStudentId()
      try {
        const enrollment = await api.enrollStudent(companyId, studentId)
        const data = await api.getOnboarding(companyId)
        const { submissions } = await api.listSubmissions(enrollment.enrollmentId)
        if (cancelled) return
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

  if (!onboarding) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <button type="button" className={styles.backButton} onClick={() => navigate('/student/home')}>
              ← 뒤로가기
            </button>
            <p>존재하지 않는 온보딩이에요.</p>
          </div>
        </div>
      </>
    )
  }

  const { completed, total } = getMissionProgress(onboarding.missions)
  const progressPercent = total ? Math.round((completed / total) * 100) : 0

  return (
    <>
      <Nav />
      <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/student/onboarding/${companyId}`)}
        >
          ← 뒤로가기
        </button>

        {isMock && <FallbackBanner />}

        <h1 className={styles.title}>미션</h1>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>진행률</span>
            <span>{completed}/{total} 완료</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <ul className={styles.missionList}>
          {onboarding.missions.map((mission) => (
            <li key={mission.id}>
              <button
                type="button"
                className={styles.missionCard}
                onClick={() => navigate(`/student/onboarding/${companyId}/missions/${mission.id}`)}
              >
                <div className={styles.missionHeader}>
                  <span className={`${styles.statusBadge} ${mission.completed ? styles.statusDone : styles.statusPending}`}>
                    {mission.completed ? '완료' : '미완료'}
                  </span>
                  <span className={styles.submissionType}>{SUBMISSION_TYPE_LABEL[mission.submissionType]}</span>
                </div>
                <span className={styles.missionTitle}>{mission.title}</span>
                <span className={styles.missionDesc}>{mission.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </>
  )
}
