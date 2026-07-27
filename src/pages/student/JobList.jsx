import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { jobs as mockJobs, JOB_SLUG_META } from '../../mock/jobs.js'
import FallbackBanner from '../../components/FallbackBanner/FallbackBanner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import styles from './JobList.module.css'

export default function JobList() {
  const navigate = useNavigate()
  const [jobList, setJobList] = useState([])
  const [isMock, setIsMock] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const realJobs = await api.listJobs()
        if (cancelled) return
        const merged = Object.entries(JOB_SLUG_META).map(([slug, meta]) => {
          const match = realJobs.find((job) => job.job_title === meta.title)
          return {
            id: slug,
            icon: meta.icon,
            name: meta.name,
            tagline: match?.description ?? meta.name,
          }
        })
        setJobList(merged)
        setIsMock(false)
      } catch (error) {
        console.error('직무 목록 API 연동 실패, mock으로 폴백합니다:', error)
        if (cancelled) return
        setJobList(mockJobs)
        setIsMock(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

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

  return (
    <>
      <Nav />
      <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>직무 체험하기</h1>
        <p className={styles.subtitle}>체험하고 싶은 직무를 선택해보세요</p>

        {isMock && <FallbackBanner />}

        <div className={styles.grid}>
          {jobList.map((job) => (
            <button
              key={job.id}
              type="button"
              className={styles.card}
              onClick={() => navigate(`/student/explore/${job.id}`)}
            >
              <span className={styles.cardTop}>
                <span className={styles.name}>{job.name}</span>
                <span className={styles.tagline}>{job.tagline}</span>
              </span>
              <span className={styles.cta}>체험하기</span>
            </button>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}
