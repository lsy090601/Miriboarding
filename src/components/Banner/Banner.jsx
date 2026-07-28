import { CheckIcon } from '../icons/Icons.jsx'
import styles from './Banner.module.css'

export default function Banner({ variant = 'success', children }) {
  return (
    <div className={`${styles.banner} ${styles[variant] ?? ''}`}>
      <span className={styles.iconDot}>
        <CheckIcon className={styles.icon} />
      </span>
      <p className={styles.text}>{children}</p>
    </div>
  )
}
