import { useLocation, useNavigate } from 'react-router-dom'
import { UserIcon } from '../icons/Icons.jsx'
import { clearStoredAuth, DEMO_COMPANY_ID } from '../../lib/auth.js'
import styles from './Nav.module.css'

const NAV_ITEMS = [
  { label: '홈', path: '/student/home', match: (p) => p === '/student/home' },
  { label: '직무체험', path: '/student/explore', match: (p) => p.startsWith('/student/explore') },
  {
    label: '온보딩',
    path: `/student/onboarding/${DEMO_COMPANY_ID}`,
    match: (p) => p.startsWith('/student/onboarding'),
  },
]

export default function Nav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    clearStoredAuth()
    navigate('/login')
  }

  return (
    <header className={styles.nav}>
      <button type="button" className={styles.logo} onClick={() => navigate('/student/home')}>
        미리보딩
      </button>

      <nav className={styles.links}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`${styles.link} ${item.match(pathname) ? styles.active : ''}`}
            onClick={() => navigate(item.path)}
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
    </header>
  )
}
