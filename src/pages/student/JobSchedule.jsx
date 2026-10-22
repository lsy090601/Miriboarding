import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getJobById, IMPORTANCE_LABEL, JOB_SLUG_META } from '../../mock/jobs.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import PageHeading from '../../components/PageHeading/PageHeading.jsx'
import BackLink from '../../components/BackLink/BackLink.jsx'
import Tabs from '../../components/Tabs/Tabs.jsx'
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

  const backToList = () => navigate('/student/explore')

  if (isLoading || !job) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.toolbar}>
              <BackLink onClick={backToList} />
            </div>
            <p className={styles.message}>{isLoading ? '불러오는 중...' : '존재하지 않는 직무예요.'}</p>
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
          <PageHeading title={job.name} subtitle="하루/주/달의 일정을 탭으로 전환하며 확인해보세요!" />

          <div className={styles.toolbar}>
            <BackLink onClick={backToList} />
            <Tabs variant="segmented" items={TABS} active={activeTab} onChange={setActiveTab} />
          </div>

          <div className={styles.scheduleList}>
            {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}
            {schedules.map((schedule) => (
              <button
                key={schedule.id}
                type="button"
                className={styles.scheduleItem}
                onClick={() => navigate(`/student/explore/${job.id}/detail/${schedule.id}`)}
              >
                <span className={styles.scheduleTitle}>{schedule.title}</span>
                <Badge size="lg" tone={IMPORTANCE_TONE[schedule.importance]}>
                  {IMPORTANCE_LABEL[schedule.importance]}
                </Badge>
              </button>
            ))}
            {schedules.length === 0 && <p className={styles.message}>등록된 일정이 없어요.</p>}
          </div>
        </div>
      </div>
    </>
  )
}
