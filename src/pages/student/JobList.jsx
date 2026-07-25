import { useNavigate } from 'react-router-dom'
import { jobs } from '../../mock/jobs.js'
import styles from './JobList.module.css'

export default function JobList() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>직무 체험하기</h1>
        <p className={styles.subtitle}>체험하고 싶은 직무를 선택해보세요</p>

        <div className={styles.grid}>
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              className={styles.card}
              onClick={() => navigate(`/student/explore/${job.id}`)}
            >
              <span className={styles.icon}>{job.icon}</span>
              <span className={styles.name}>{job.name}</span>
              <span className={styles.tagline}>{job.tagline}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
