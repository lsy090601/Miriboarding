import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getJobById, getScheduleById, IMPORTANCE_LABEL, JOB_SLUG_META } from '../../mock/jobs.js'
import Modal from '../../components/Modal/Modal.jsx'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
import styles from './ScheduleDetail.module.css'

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
      <div className={styles.page}>
        <div className={styles.container}>불러오는 중...</div>
      </div>
    )
  }

  const schedule = isMock ? getScheduleById(jobId, scheduleId) : job?.schedules.find((s) => s.id === scheduleId)

  if (!job || !schedule) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button type="button" className={styles.backButton} onClick={() => navigate('/student/explore')}>
            ← 뒤로가기
          </button>
          <p>존재하지 않는 일정이에요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/student/explore/${job.id}`)}
        >
          ← 뒤로가기
        </button>

        {isMock && <FallbackBanner />}

        <div className={styles.header}>
          <h1 className={styles.title}>{schedule.title}</h1>
          <span className={`${styles.importance} ${styles[`importance-${schedule.importance}`]}`}>
            {IMPORTANCE_LABEL[schedule.importance]}
          </span>
        </div>

        <p className={styles.description}>{schedule.description}</p>

        <h2 className={styles.termsTitle}>관련 용어</h2>
        <div className={styles.termList}>
          {(schedule.terms ?? []).map((term) => (
            <button
              key={term.term}
              type="button"
              className={styles.termChip}
              onClick={() => setActiveTerm(term)}
            >
              {term.term}
            </button>
          ))}
        </div>
      </div>

      {activeTerm && (
        <Modal title={activeTerm.term} onClose={() => setActiveTerm(null)}>
          <p>{activeTerm.description}</p>
        </Modal>
      )}
    </div>
  )
}
