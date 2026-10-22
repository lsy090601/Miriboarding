import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { getJobById, getScheduleById, IMPORTANCE_LABEL, JOB_SLUG_META } from '../../mock/jobs.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import BackLink from '../../components/BackLink/BackLink.jsx'
import Badge from '../../components/Badge/Badge.jsx'
import styles from './ScheduleDetail.module.css'

const IMPORTANCE_TONE = { high: 'error', medium: 'warning', low: 'info' }

export default function ScheduleDetail() {
  const { jobId, scheduleId } = useParams()
  const navigate = useNavigate()
  const [activeTermName, setActiveTermName] = useState(null)

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

  const schedule = isLoading
    ? null
    : isMock
      ? getScheduleById(jobId, scheduleId)
      : job?.schedules.find((s) => s.id === scheduleId)

  if (!job || !schedule) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <BackLink onClick={() => navigate(job ? `/student/explore/${job.id}` : '/student/explore')} />
            <p className={styles.message}>{isLoading ? '불러오는 중...' : '존재하지 않는 일정이에요.'}</p>
          </div>
        </div>
      </>
    )
  }

  const terms = schedule.terms ?? []
  const activeTerm = terms.find((term) => term.term === activeTermName) ?? terms[0]

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.titleBox}>{schedule.title}</h1>
            <div className={styles.headerRow}>
              <BackLink onClick={() => navigate(`/student/explore/${job.id}`)} />
              <Badge size="lg" tone={IMPORTANCE_TONE[schedule.importance]}>
                {IMPORTANCE_LABEL[schedule.importance]}
              </Badge>
            </div>
            {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}
            {schedule.description && <p className={styles.description}>{schedule.description}</p>}
          </div>

          {terms.length > 0 && (
            <section className={styles.terms}>
              <h2 className={styles.termsTitle}>관련용어</h2>
              <div className={styles.termGroup}>
                <div className={styles.termList} role="tablist">
                  {terms.map((term) => {
                    const selected = term.term === activeTerm.term
                    return (
                      <button
                        key={term.term}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`${styles.term} ${selected ? styles.termActive : ''}`}
                        onClick={() => setActiveTermName(term.term)}
                      >
                        {term.term}
                      </button>
                    )
                  })}
                </div>
                <p className={styles.termDescription}>{activeTerm.description}</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
