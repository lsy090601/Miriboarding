import styles from './ActionCard.module.css'

export default function ActionCard({ icon, title, description, meta, badge, onClick, layout = 'card', compact = false }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[layout] ?? ''} ${compact ? styles.compact : ''}`}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.body}>
        <span className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {badge}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </button>
  )
}
