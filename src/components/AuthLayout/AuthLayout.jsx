import styles from './AuthLayout.module.css'

export default function AuthLayout({ children }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.logo}>미리보딩</p>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
