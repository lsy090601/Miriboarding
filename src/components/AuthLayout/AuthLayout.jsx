import styles from './AuthLayout.module.css'

export default function AuthLayout({ children, aside, size = 'md', className = '' }) {
  if (aside) {
    return (
      <div className={styles.page}>
        <div className={styles.cardSplit}>
          <div className={styles.brandPanel}>{aside}</div>
          <div className={`${styles.formPanel} ${className}`}>{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.cardCentered} ${styles[size]}`}>
        <div className={`${styles.content} ${className}`}>
          <p className={styles.logo}>미리보딩</p>
          {children}
        </div>
      </div>
    </div>
  )
}
