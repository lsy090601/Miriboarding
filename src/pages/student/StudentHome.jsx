import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal/Modal.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import { DEMO_COMPANY_ID } from '../../lib/auth.js'
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
    navigate(`/student/onboarding/${DEMO_COMPANY_ID}`)
  }

  return (
    <>
      <Nav />
      <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.greeting}>안녕하세요!</p>
        <p className={styles.subGreeting}>첫 직무를 경험해보세요!</p>

        <div className={styles.cardList}>
          <button
            type="button"
            className={styles.card}
            onClick={() => navigate('/student/explore')}
          >
            <span className={styles.cardTop}>
              <span className={styles.cardTitle}>직무 체험하기</span>
              <span className={styles.cardDesc}>{'다양한 직무를 체험해보고\n나에게 맞는 일을 찾아보세요'}</span>
            </span>
            <span className={styles.cardCta}>지금 시작하기</span>
          </button>

          <button type="button" className={styles.card} onClick={handleOnboardingClick}>
            <span className={styles.cardTop}>
              <span className={styles.cardTitle}>온보딩 시작</span>
              <span className={styles.cardDesc}>
                {'취업이 확정되면 회사의 일원이 되기 위한\n온보딩을 시작할 수 있습니다'}
              </span>
            </span>
            <span className={styles.cardCta}>{isEnrolled ? '지금 시작하기' : '준비중 ...'}</span>
          </button>
        </div>
      </div>

      {showNotEnrolledModal && (
        <Modal closeLabel="돌아가기" onClose={() => setShowNotEnrolledModal(false)}>
          <p>죄송합니다!</p>
          <p>온보딩 시작은 취업이 확정되어야</p>
          <p>체험이 가능합니다</p>
        </Modal>
      )}
      </div>
    </>
  )
}
