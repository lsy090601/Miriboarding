import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getJobById, IMPORTANCE_LABEL, JOB_SLUG_META } from '../../mock/jobs.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import Tabs from '../../components/Tabs/Tabs.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import styles from './JobSchedule.module.css'

const TABS = [
  { key: 'day', label: '하루' },
  { key: 'week', label: '1주' },
  { key: 'month', label: '1달' },
]

const IMPORTANCE_TONE = { high: 'error', medium: 'warning', low: 'info' }

export default function JobSchedule() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('day')

  const [job, setJob] = useState(null)
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const meta = JOB_SLUG_META[jobId]
      try {
        if (!meta) throw new Error('알 수 없는 직무 슬러그입니다.')
        const realJobs = await api.listJobs()
        const match = realJobs.find((j) => j.job_title === meta.title)
        if (!match) throw new Error('직무를 찾을 수 없습니다.')
        const data = await api.getJobSchedule(match.id)
        if (cancelled) return
        setJob(
          api.normalizeJobScheduleResponse(
            { id: jobId, icon: meta.icon, name: meta.name, tagline: match.description },
            data,
          ),
        )
        setIsMock(false)
      } catch (error) {
        console.error('직무 일정 API 연동 실패, mock으로 폴백합니다:', error)
        if (cancelled) return
        setJob(getJobById(jobId))
        setIsMock(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [jobId])

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

  if (!job) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/explore')}>
              ← 직무 선택으로 돌아가기
            </Button>
            <p>존재하지 않는 직무예요.</p>
          </div>
        </div>
      </>
    )
  }

  const schedules = job.schedules.filter((schedule) => schedule.period === activeTab)

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate('/student/explore')}>
            ← 직무 선택으로 돌아가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <div className={styles.header}>
            <span className={styles.icon}>{job.icon}</span>
            <h1 className={styles.title}>{job.name}</h1>
          </div>
          <p className={styles.subtitle}>하루/주/달의 일정을 탭으로 전환하며 확인해보세요</p>

          <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

          <div className={styles.scheduleList}>
            {schedules.map((schedule) => (
              <ActionCard
                key={schedule.id}
                layout="row"
                title={schedule.title}
                badge={<Badge tone={IMPORTANCE_TONE[schedule.importance]}>{IMPORTANCE_LABEL[schedule.importance]}</Badge>}
                onClick={() => navigate(`/student/explore/${job.id}/detail/${schedule.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
