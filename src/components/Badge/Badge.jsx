import styles from './Badge.module.css'

export default function Badge({ tone = 'neutral', size = 'md', children }) {
  return <span className={`${styles.badge} ${styles[tone] ?? ''} ${size === 'lg' ? styles.lg : ''}`}>{children}</span>
}
