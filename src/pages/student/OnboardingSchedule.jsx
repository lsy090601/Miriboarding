import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import { getOnboardingByCompanyId, IMPORTANCE_LABEL } from '../../mock/onboarding.js'
import Modal from '../../components/Modal/Modal.jsx'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
import styles from './OnboardingSchedule.module.css'

const TABS = [
  { key: 'day', label: '하루' },
  { key: 'week', label: '1주' },
  { key: 'month', label: '1달' },
]

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

  const schedules = onboarding.schedules[activeTab]

  return (
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

        <h1 className={styles.title}>{onboarding.companyName}의 {onboarding.jobTitle}</h1>
        <p className={styles.notice}>회사가 커스터마이징한 일정입니다</p>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ul className={styles.scheduleList}>
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <button
                type="button"
                className={styles.scheduleItem}
                onClick={() => setActiveSchedule(schedule)}
              >
                <span className={styles.scheduleTitle}>
                  {schedule.subtitle && <span className={styles.scheduleSubtitle}>{schedule.subtitle}</span>}
                  {schedule.title}
                </span>
                <span className={`${styles.importance} ${styles[`importance-${schedule.importance}`]}`}>
                  {IMPORTANCE_LABEL[schedule.importance]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeSchedule && (
        <Modal title={activeSchedule.title} onClose={() => setActiveSchedule(null)}>
          <p>{activeSchedule.description}</p>
        </Modal>
      )}
    </div>
  )
}
