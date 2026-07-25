import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOnboardingByCompanyId, IMPORTANCE_LABEL } from '../../mock/onboarding.js'
import Modal from '../../components/Modal/Modal.jsx'
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

  const onboarding = getOnboardingByCompanyId(companyId)

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
                <span className={styles.scheduleTitle}>{schedule.title}</span>
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
