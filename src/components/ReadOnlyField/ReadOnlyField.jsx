import styles from './ReadOnlyField.module.css'

export default function ReadOnlyField({ icon, label, value }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || '-'}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </div>
  )
}
