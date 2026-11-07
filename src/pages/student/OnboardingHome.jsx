import { useNavigate, useParams } from 'react-router-dom'
import useStudentOnboarding from '../../hooks/useStudentOnboarding.js'
import { getDDay, formatDate, getMissionProgress } from '../../mock/onboarding.js'
import Nav from '../../components/Nav/Nav.jsx'
import BackLink from '../../components/BackLink/BackLink.jsx'
import ImageCard from '../../components/ImageCard/ImageCard.jsx'
import ProgressBar from '../../components/ProgressBar/ProgressBar.jsx'
import imgSchedule from '../../assets/figma/onboarding-2.jpg'
import imgMission from '../../assets/figma/onboarding-3.jpg'
import styles from './OnboardingHome.module.css'

export default function OnboardingHome() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const { onboarding, isLoading, loadError } = useStudentOnboarding(companyId)

  const goHome = () => navigate('/student/home')

  if (isLoading || !onboarding) {
    return (
      <>
        <Nav />
        <div className={styles.page}>
          <div className={styles.container}>
            <BackLink onClick={goHome} />
            <p className={styles.message} role="status">{isLoading ? '불러오는 중...' : loadError}</p>
          </div>
        </div>
      </>
    )
  }

  const dDay = onboarding.targetDate ? getDDay(onboarding.targetDate) : null
  const dDayLabel = dDay === null ? 'D- ?' : dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`
  const missionProgress = getMissionProgress(onboarding.missions)
  const overallProgress = missionProgress.total
    ? Math.round((missionProgress.completed / missionProgress.total) * 100)
    : 0

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.top}>
            <div className={styles.headerText}>
              <BackLink onClick={goHome} />
              <p className={styles.subtitle}>
                {onboarding.companyName} | {onboarding.jobTitle}
              </p>
            </div>


            <div className={styles.dDay}>
              <span className={styles.dDayValue}>{dDayLabel}</span>
              <span className={styles.dDayMeta}>
                {onboarding.targetDate
                  ? `실습 시작일 ${formatDate(onboarding.targetDate)}`
                  : '실습 시작일이 아직 정해지지 않았어요'}
              </span>
            </div>
          </div>

          <div className={styles.cardList}>
            <ImageCard
              size="square"
              image={imgSchedule}
              title="직무 체험"
              description={`${onboarding.companyName}에 맞춰진 일정을 확인해보세요`}
              onClick={() => navigate(`/student/onboarding/${companyId}/explore`)}
            />
            <ImageCard
              size="square"
              image={imgMission}
              title="미션"
              description={`${missionProgress.completed}/${missionProgress.total} 완료`}
              onClick={() => navigate(`/student/onboarding/${companyId}/missions`)}
            />
          </div>

          <ProgressBar variant="card" label="전체 진도율" value={overallProgress} valueLabel={`${overallProgress}%`} />
        </div>
      </div>
    </>
  )
}
