import styles from './ProgressBar.module.css'

export default function ProgressBar({ value, label, valueLabel, variant = 'default' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))

  if (variant === 'card') {
    return (
      <div className={styles.card}>
        {label && <span className={styles.cardLabel}>{label}</span>}
        <div className={styles.cardRow}>
          <div className={`${styles.track} ${styles.cardTrack}`}>
            <div className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.cardValue}>{valueLabel ?? `${pct}%`}</span>
        </div>
      </div>
    )
  }

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
