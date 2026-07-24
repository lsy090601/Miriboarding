import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getJobById, IMPORTANCE_LABEL } from '../../mock/jobs.js'
import styles from './JobSchedule.module.css'

const TABS = [
  { key: 'day', label: '하루' },
  { key: 'week', label: '1주' },
  { key: 'month', label: '1달' },
]

export default function JobSchedule() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('day')

  const job = getJobById(jobId)

  if (!job) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button type="button" className={styles.backButton} onClick={() => navigate('/student/explore')}>
            ← 뒤로가기
          </button>
          <p>존재하지 않는 직무예요.</p>
        </div>
      </div>
    )
  }

  const schedules = job.schedules.filter((schedule) => schedule.period === activeTab)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/student/explore')}>
          ← 뒤로가기
        </button>

        <div className={styles.header}>
          <span className={styles.icon}>{job.icon}</span>
          <h1 className={styles.title}>{job.name}</h1>
        </div>

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
                onClick={() => navigate(`/student/explore/${job.id}/detail/${schedule.id}`)}
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
    </div>
  )
}
