import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal/Modal.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import ActionCard from '../../components/ActionCard/ActionCard.jsx'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import styles from './StudentHome.module.css'

export default function StudentHome() {
  const navigate = useNavigate()
  const [enrolledCompanyId, setEnrolledCompanyId] = useState(null)
  const [showNotEnrolledModal, setShowNotEnrolledModal] = useState(false)
  const isEnrolled = Boolean(enrolledCompanyId)

  useEffect(() => {
    let cancelled = false
    api
      .getStudentEnrollments(getCurrentStudentId())
      .then(({ enrollments }) => {
        if (cancelled) return
        setEnrolledCompanyId(enrollments[0]?.companyId ?? null)
      })
      .catch(() => {
        if (!cancelled) setEnrolledCompanyId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleOnboardingClick() {
    if (!enrolledCompanyId) {
      setShowNotEnrolledModal(true)
      return
    }
    navigate(`/student/onboarding/${enrolledCompanyId}`)
  }

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.greeting}>안녕하세요!</p>
          <p className={styles.subGreeting}>첫 직무를 경험해보세요!</p>

          <div className={styles.cardList}>
            <ActionCard
              icon="🧭"
              title="직무 체험하기"
              description={'다양한 직무를 체험해보고\n나에게 맞는 일을 찾아보세요'}
              meta="지금 시작하기"
              onClick={() => navigate('/student/explore')}
            />
            <ActionCard
              icon="🚀"
              title="온보딩 시작"
              description={'취업이 확정되면 회사의 일원이 되기 위한\n온보딩을 시작할 수 있습니다'}
              meta={isEnrolled ? '지금 시작하기' : '준비중 ...'}
              onClick={handleOnboardingClick}
            />
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
