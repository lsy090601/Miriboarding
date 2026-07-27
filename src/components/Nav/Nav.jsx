import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserIcon } from '../icons/Icons.jsx'
import Modal from '../Modal/Modal.jsx'
import * as api from '../../lib/api.js'
import { clearStoredAuth, getCurrentStudentId } from '../../lib/auth.js'
import styles from './Nav.module.css'

const NAV_ITEMS = [
  { key: 'home', label: '홈', path: '/student/home', match: (p) => p === '/student/home' },
  {
    key: 'explore',
    label: '직무체험',
    path: '/student/explore',
    match: (p) => p.startsWith('/student/explore'),
  },
  {
    key: 'onboarding',
    label: '온보딩',
    match: (p) => p.startsWith('/student/onboarding'),
    guarded: true,
  },
]

export default function Nav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [showNotEnrolledModal, setShowNotEnrolledModal] = useState(false)
  const [enrolledCompanyId, setEnrolledCompanyId] = useState(null)

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

  function handleLogout() {
    clearStoredAuth()
    navigate('/login')
  }

  function handleNavClick(item) {
    if (item.key === 'onboarding') {
      if (!enrolledCompanyId) {
        setShowNotEnrolledModal(true)
        return
      }
      navigate(`/student/onboarding/${enrolledCompanyId}`)
      return
    }
    navigate(item.path)
  }

  return (
    <header className={styles.nav}>
      <button type="button" className={styles.logo} onClick={() => navigate('/student/home')}>
        미리보딩
      </button>

      <nav className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.link} ${item.match(pathname) ? styles.active : ''}`}
            onClick={() => handleNavClick(item)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className={styles.link} onClick={handleLogout}>
          로그아웃
        </button>
        <span className={styles.profileIcon}>
          <UserIcon />
        </span>
      </nav>

      {showNotEnrolledModal && (
        <Modal closeLabel="돌아가기" onClose={() => setShowNotEnrolledModal(false)}>
          <p>죄송합니다!</p>
          <p>온보딩 시작은 취업이 확정되어야</p>
          <p>체험이 가능합니다</p>
        </Modal>
      )}
    </header>
  )
}
