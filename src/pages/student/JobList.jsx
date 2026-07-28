import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { jobs as mockJobs, JOB_SLUG_META } from '../../mock/jobs.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
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

          {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}

          <div className={styles.grid}>
            {jobList.map((job) => (
              <ActionCard
                key={job.id}
                icon={job.icon}
                title={job.name}
                description={job.tagline}
                meta="체험하기"
                onClick={() => navigate(`/student/explore/${job.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
