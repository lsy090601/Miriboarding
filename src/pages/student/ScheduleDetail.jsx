import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getJobById, getScheduleById, IMPORTANCE_LABEL } from '../../mock/jobs.js'
import Modal from '../../components/Modal/Modal.jsx'
import styles from './ScheduleDetail.module.css'

export default function ScheduleDetail() {
  const { jobId, scheduleId } = useParams()
  const navigate = useNavigate()
  const [activeTerm, setActiveTerm] = useState(null)

  const job = getJobById(jobId)
  const schedule = getScheduleById(jobId, scheduleId)

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

        <div className={styles.header}>
          <h1 className={styles.title}>{schedule.title}</h1>
          <span className={`${styles.importance} ${styles[`importance-${schedule.importance}`]}`}>
            {IMPORTANCE_LABEL[schedule.importance]}
          </span>
        </div>

        <p className={styles.description}>{schedule.description}</p>

        <h2 className={styles.termsTitle}>관련 용어</h2>
        <div className={styles.termList}>
          {schedule.terms.map((term) => (
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
