import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getStoredAuth, MOCK_STUDENT_ID } from '../../lib/auth.js'
import { getOnboardingByCompanyId, getDDay, formatDate, getMissionProgress } from '../../mock/onboarding.js'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
import styles from './OnboardingHome.module.css'

export default function OnboardingHome() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const [onboarding, setOnboarding] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const studentId = getStoredAuth()?.userId ?? MOCK_STUDENT_ID
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
      <div className={styles.page}>
        <div className={styles.container}>불러오는 중...</div>
      </div>
    )
  }

  if (!onboarding) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button type="button" className={styles.backButton} onClick={() => navigate('/student/home')}>
            ← 뒤로가기
          </button>
          <p>존재하지 않는 온보딩이에요.</p>
        </div>
      </div>
    )
  }

  const dDay = getDDay(onboarding.targetDate)
  const missionProgress = getMissionProgress(onboarding.missions)
  const overallProgress = missionProgress.total
    ? Math.round((missionProgress.completed / missionProgress.total) * 100)
    : 0

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/student/home')}>
          ← 뒤로가기
        </button>

        {isMock && <FallbackBanner />}

        <p className={styles.subtitle}>
          {onboarding.companyName} | {onboarding.jobTitle}
        </p>

        <div className={styles.ddayBox}>
          {onboarding.targetDate ? (
            <>
              <span className={styles.ddayLabel}>{dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}</span>
              <span className={styles.ddayDate}>실습 시작일 {formatDate(onboarding.targetDate)}</span>
            </>
          ) : (
            <span className={styles.ddayDate}>실습 시작일이 아직 정해지지 않았어요</span>
          )}
        </div>

        <div className={styles.cardList}>
          <button
            type="button"
            className={styles.card}
            onClick={() => navigate(`/student/onboarding/${companyId}/explore`)}
          >
            <span className={styles.cardIcon}>🧭</span>
            <span className={styles.cardTitle}>직무 체험 (회사 커스텀)</span>
            <span className={styles.cardDesc}>{onboarding.companyName}에 맞춰진 일정을 확인해보세요</span>
          </button>

          <button
            type="button"
            className={styles.card}
            onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}
          >
            <span className={styles.cardIcon}>📝</span>
            <span className={styles.cardTitle}>미션</span>
            <span className={styles.cardDesc}>
              {missionProgress.completed}/{missionProgress.total} 완료
            </span>
          </button>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>전체 진도율</span>
            <span>{overallProgress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressBarFill} style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
