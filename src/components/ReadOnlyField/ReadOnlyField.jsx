import styles from './ReadOnlyField.module.css'

export default function ReadOnlyField({ label, value, autoFilled = true }) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {autoFilled && <span className={styles.tag}>자동 입력됨</span>}
      </div>
      <div className={styles.value}>{value || '-'}</div>
    </div>
  )
}
