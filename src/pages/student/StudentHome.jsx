import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal/Modal.jsx'
import Nav from '../../components/Nav/Nav.jsx'
import PageHeading from '../../components/PageHeading/PageHeading.jsx'
import ImageCard from '../../components/ImageCard/ImageCard.jsx'
import * as api from '../../lib/api.js'
import { getCurrentStudentId } from '../../lib/auth.js'
import imgHomeJob from '../../assets/figma/student-home-1.jpg'
import imgHomeOnboarding from '../../assets/figma/student-home-2.jpg'
import styles from './StudentHome.module.css'

export default function StudentHome() {
  const navigate = useNavigate()
  const [enrolledCompanyId, setEnrolledCompanyId] = useState(null)
  const [showNotEnrolledModal, setShowNotEnrolledModal] = useState(false)

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
          <PageHeading title="안녕하세요!" subtitle="첫 직무를 경험해 보세요!" />

          <div className={styles.cardList}>
            <ImageCard
              size="lg"
              image={imgHomeJob}
              title="직무 체험하기"
              description="다양한 직무를 체험해보고 나에게 맞는 일을 찾아보세요"
              onClick={() => navigate('/student/explore')}
            />
            <ImageCard
              size="lg"
              image={imgHomeOnboarding}
              title="온보딩 시작"
              description="취업이 확정되면 회사의 일원이 되기 위한 온보딩을 시작할 수 있어요"
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
