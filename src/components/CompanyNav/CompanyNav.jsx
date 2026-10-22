import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuth } from '../../lib/auth.js'
import styles from './CompanyNav.module.css'

export default function CompanyNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const items = [
    { label: '온보딩 관리', path: '/company/onboarding-list', active: pathname.includes('/company/onboarding') },
    { label: '학생 현황', path: '/company/students', active: pathname.includes('/company/student') || pathname.includes('/company/register') },
  ]

  function logout() {
    clearStoredAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header className={styles.nav}>
      <button className={styles.logo} onClick={() => navigate('/company/home')}>미리보딩</button>
      <nav className={styles.links}>
        {items.map((item) => (
          <button key={item.path} className={`${styles.link} ${item.active ? styles.active : ''}`} onClick={() => navigate(item.path)}>
            {item.label}
          </button>
        ))}
        <button className={styles.link} onClick={logout}>로그아웃</button>
      </nav>
    </header>
  )
}
