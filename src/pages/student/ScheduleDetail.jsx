import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getJobById, getScheduleById, IMPORTANCE_LABEL, JOB_SLUG_META } from '../../mock/jobs.js'
import Modal from '../../components/Modal/Modal.jsx'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import Button from '../../components/Button/Button.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import Chip from '../../components/Chip/Chip.jsx'
import styles from './ScheduleDetail.module.css'

const IMPORTANCE_TONE = { high: 'error', medium: 'warning', low: 'info' }

export default function ScheduleDetail() {
  const { jobId, scheduleId } = useParams()
  const navigate = useNavigate()
  const [activeTerm, setActiveTerm] = useState(null)

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

  const schedule = isMock ? getScheduleById(jobId, scheduleId) : job?.schedules.find((s) => s.id === scheduleId)

  if (!job || !schedule) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/explore')}>
              ← 직무 선택으로 돌아가기
            </Button>
            <p>존재하지 않는 일정이에요.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/explore/${job.id}`)}>
            ← 직무 일정으로 돌아가기
          </Button>

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <div className={styles.header}>
            <h1 className={styles.title}>{schedule.title}</h1>
            <Badge tone={IMPORTANCE_TONE[schedule.importance]}>{IMPORTANCE_LABEL[schedule.importance]}</Badge>
          </div>

          <p className={styles.description}>{schedule.description}</p>

          <h2 className={styles.termsTitle}>관련 용어</h2>
          <div className={styles.termList}>
            {(schedule.terms ?? []).map((term) => (
              <Chip key={term.term} onClick={() => setActiveTerm(term)}>
                {term.term}
              </Chip>
            ))}
          </div>
        </div>

        {activeTerm && (
          <Modal title={activeTerm.term} onClose={() => setActiveTerm(null)}>
            <p>{activeTerm.description}</p>
          </Modal>
        )}
      </div>
    </>
  )
}
