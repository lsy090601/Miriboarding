import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../../lib/api.js'
import { jobs as mockJobs, JOB_SLUG_META } from '../../mock/jobs.js'
import Banner from '../../components/Banner/Banner.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import PageHeading from '../../components/PageHeading/PageHeading.jsx'
import ImageCard from '../../components/ImageCard/ImageCard.jsx'
import imgBackend from '../../assets/figma/job-1.jpg'
import imgFrontend from '../../assets/figma/job-2.jpg'
import imgData from '../../assets/figma/job-3.jpg'
import imgLogistics from '../../assets/figma/job-6.jpg'
import imgFinance from '../../assets/figma/job-9.jpg'
import styles from './JobList.module.css'

const JOB_IMAGES = {
  backend: imgBackend,
  frontend: imgFrontend,
  logistics: imgLogistics,
  data: imgData,
  finance: imgFinance,
}

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

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <PageHeading title="직무체험" subtitle="체험하고 싶은 직무를 선택해보세요!" />

          {isLoading ? (
            <p className={styles.loading}>불러오는 중...</p>
          ) : (
            <div className={styles.body}>
              {isMock && <Banner variant="warning">서버 연결에 실패해서 mock 데이터로 표시 중이에요.</Banner>}
              <div className={styles.grid}>
                {jobList.map((job) => (
                  <ImageCard
                    key={job.id}
                    size="md"
                    image={JOB_IMAGES[job.id]}
                    title={job.name}
                    description={job.tagline}
                    onClick={() => navigate(`/student/explore/${job.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
