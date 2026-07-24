import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal/Modal.jsx'
import styles from './StudentHome.module.css'

export default function StudentHome() {
  const navigate = useNavigate()
  const [isEnrolled] = useState(false)
  const [showNotEnrolledModal, setShowNotEnrolledModal] = useState(false)

  function handleOnboardingClick() {
    if (!isEnrolled) {
      setShowNotEnrolledModal(true)
      return
    }
    navigate('/student/onboarding/home')
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.greeting}>안녕하세요 👋</h1>
        <p className={styles.subGreeting}>오늘도 새로운 직무를 만나볼까요?</p>

        <div className={styles.cardList}>
          <button
            type="button"
            className={styles.card}
            onClick={() => navigate('/student/explore')}
          >
            <span className={styles.cardIcon}>🧭</span>
            <span className={styles.cardTitle}>직무 체험하기</span>
            <span className={styles.cardDesc}>다양한 직무의 하루를 미리 경험해보세요</span>
          </button>

          <button
            type="button"
            className={`${styles.card} ${!isEnrolled ? styles.cardDisabled : ''}`}
            onClick={handleOnboardingClick}
          >
            <span className={styles.cardIcon}>🚀</span>
            <span className={styles.cardTitle}>온보딩 시작</span>
            <span className={styles.cardDesc}>입사가 확정되면 온보딩을 시작할 수 있어요</span>
          </button>
        </div>
      </div>

      {showNotEnrolledModal && (
        <Modal title="안내" onClose={() => setShowNotEnrolledModal(false)}>
          <p>아직 취업이 확정되지 않았어요.</p>
          <p>입사가 확정되면 온보딩을 시작할 수 있습니다.</p>
        </Modal>
      )}
    </div>
  )
}
