import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId, getMissionProgress, SUBMISSION_TYPE_LABEL } from '../../mock/onboarding.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import ProgressBar from '../../components/ProgressBar/ProgressBar.jsx'
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
            <Button variant="outline" size="sm" onClick={() => navigate('/student/home')}>
              ← 뒤로가기
            </Button>
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
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/onboarding/${companyId}`)}>
            ← 뒤로가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <h1 className={styles.title}>미션</h1>

          <div className={styles.progressSection}>
            <ProgressBar label="진행률" valueLabel={`${completed}/${total} 완료`} value={progressPercent} />
          </div>

          <div className={styles.missionList}>
            {onboarding.missions.map((mission) => (
              <ActionCard
                key={mission.id}
                title={mission.title}
                description={mission.description}
                meta={SUBMISSION_TYPE_LABEL[mission.submissionType]}
                badge={<Badge tone={mission.completed ? 'success' : 'neutral'}>{mission.completed ? '완료' : '미완료'}</Badge>}
                onClick={() => navigate(`/student/onboarding/${companyId}/missions/${mission.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
