import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId, IMPORTANCE_LABEL } from '../../mock/onboarding.js'
import Modal from '../../components/Modal/Modal.jsx'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import Tabs from '../../components/Tabs/Tabs.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import styles from './OnboardingSchedule.module.css'

const TABS = [
  { key: 'day', label: '하루' },
  { key: 'week', label: '1주' },
  { key: 'month', label: '1달' },
]

const IMPORTANCE_TONE = { high: 'error', medium: 'warning', low: 'info' }

export default function OnboardingSchedule() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('day')
  const [activeSchedule, setActiveSchedule] = useState(null)

  const [onboarding, setOnboarding] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const studentId = getCurrentStudentId()
      try {
        await api.enrollStudent(companyId, studentId)
        const data = await api.getOnboarding(companyId)
        if (cancelled) return
        setOnboarding(api.normalizeOnboardingResponse(companyId, data, []))
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

  const schedules = onboarding.schedules[activeTab]

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/onboarding/${companyId}`)}>
            ← 뒤로가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <h1 className={styles.title}>
            {onboarding.companyName}의 {onboarding.jobTitle}
          </h1>
          <p className={styles.notice}>회사가 커스터마이징한 일정입니다</p>

          <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

          <div className={styles.scheduleList}>
            {schedules.map((schedule) => (
              <ActionCard
                key={schedule.id}
                layout="row"
                title={
                  schedule.subtitle ? (
                    <span className={styles.titleWithSub}>
                      <span className={styles.scheduleSubtitle}>{schedule.subtitle}</span>
                      {schedule.title}
                    </span>
                  ) : (
                    schedule.title
                  )
                }
                badge={<Badge tone={IMPORTANCE_TONE[schedule.importance]}>{IMPORTANCE_LABEL[schedule.importance]}</Badge>}
                onClick={() => setActiveSchedule(schedule)}
              />
            ))}
          </div>
        </div>

        {activeSchedule && (
          <Modal title={activeSchedule.title} onClose={() => setActiveSchedule(null)}>
            <p>{activeSchedule.description}</p>
          </Modal>
        )}
      </div>
    </>
  )
}
