import styles from './PageHeading.module.css'

export default function PageHeading({ title, subtitle }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && (
        <p className={styles.subtitle}>
          <span className={`${styles.quote} ${styles.open}`} aria-hidden="true">
            “
          </span>
          <span className={styles.text}>{subtitle}</span>
          <span className={`${styles.quote} ${styles.close}`} aria-hidden="true">
            ”
          </span>
        </p>
      )}
    </div>
  )
}
