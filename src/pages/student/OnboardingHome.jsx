import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId, getDDay, formatDate, getMissionProgress } from '../../mock/onboarding.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import ProgressBar from '../../components/ProgressBar/ProgressBar.jsx'
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
      const studentId = getCurrentStudentId()
      try {
        const enrollment = await api.enrollStudent(companyId, studentId)
        const data = await api.getOnboarding(companyId)
        const { submissions } = await api.listSubmissions(enrollment.enrollmentId)
        if (cancelled) return
        const normalized = api.normalizeOnboardingResponse(companyId, data, submissions)
        normalized.targetDate = enrollment.targetDate
        setOnboarding(normalized)
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
            <Button variant="outline" size="sm" onClick={() => navigate('/student/home')}>
              ← 뒤로가기
            </Button>
            <p>존재하지 않는 온보딩이에요.</p>
          </div>
        </div>
      </>
    )
  }

  const dDay = getDDay(onboarding.targetDate)
  const missionProgress = getMissionProgress(onboarding.missions)
  const overallProgress = missionProgress.total
    ? Math.round((missionProgress.completed / missionProgress.total) * 100)
    : 0

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/home')}>
            ← 뒤로가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <p className={styles.subtitle}>
            {onboarding.companyName} | {onboarding.jobTitle}
          </p>

          <StatCard
            emphasis
            label="D-day"
            value={onboarding.targetDate ? (dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`) : '일정 미정'}
            meta={
              onboarding.targetDate
                ? `실습 시작일 ${formatDate(onboarding.targetDate)}`
                : '실습 시작일이 아직 정해지지 않았어요'
            }
          />

          <div className={styles.cardList}>
            <ActionCard
              icon="🧭"
              title="직무 체험 (회사 커스텀)"
              description={`${onboarding.companyName}에 맞춰진 일정을 확인해보세요`}
              onClick={() => navigate(`/student/onboarding/${companyId}/explore`)}
            />
            <ActionCard
              icon="📝"
              title="미션"
              description={`${missionProgress.completed}/${missionProgress.total} 완료`}
              onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}
            />
          </div>

          <div className={styles.progressSection}>
            <ProgressBar label="전체 진도율" valueLabel={`${overallProgress}%`} value={overallProgress} />
          </div>
        </div>
      </div>
    </>
  )
}
