import styles from './StatCard.module.css'

export default function StatCard({ label, value, meta, emphasis = false }) {
  return (
    <div className={`${styles.card} ${emphasis ? styles.emphasis : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  )
}
