import styles from './ProgressBar.module.css'

export default function ProgressBar({ value, label, valueLabel }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className={styles.wrap}>
      {(label || valueLabel) && (
        <div className={styles.header}>
          {label && <span>{label}</span>}
          {valueLabel && <span>{valueLabel}</span>}
        </div>
      )}
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
