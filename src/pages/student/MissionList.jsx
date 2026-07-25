import { useNavigate, useParams } from 'react-router-dom'
import { getOnboardingByCompanyId, getMissionProgress, SUBMISSION_TYPE_LABEL } from '../../mock/onboarding.js'
import styles from './MissionList.module.css'

export default function MissionList() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const onboarding = getOnboardingByCompanyId(companyId)

  if (!onboarding) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <button type="button" className={styles.backButton} onClick={() => navigate('/student/home')}>
            ← 뒤로가기
          </button>
          <p>존재하지 않는 온보딩이에요.</p>
        </div>
      </div>
    )
  }

  const { completed, total } = getMissionProgress(onboarding.missions)
  const progressPercent = Math.round((completed / total) * 100)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/student/onboarding/${companyId}`)}
        >
          ← 뒤로가기
        </button>

        <h1 className={styles.title}>미션</h1>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>진행률</span>
            <span>{completed}/{total} 완료</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <ul className={styles.missionList}>
          {onboarding.missions.map((mission) => (
            <li key={mission.id}>
              <button
                type="button"
                className={styles.missionCard}
                onClick={() => navigate(`/student/onboarding/${companyId}/missions/${mission.id}`)}
              >
                <div className={styles.missionHeader}>
                  <span className={`${styles.statusBadge} ${mission.completed ? styles.statusDone : styles.statusPending}`}>
                    {mission.completed ? '완료' : '미완료'}
                  </span>
                  <span className={styles.submissionType}>{SUBMISSION_TYPE_LABEL[mission.submissionType]}</span>
                </div>
                <span className={styles.missionTitle}>{mission.title}</span>
                <span className={styles.missionDesc}>{mission.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
