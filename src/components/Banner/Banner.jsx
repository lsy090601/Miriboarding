import { CheckIcon } from '../icons/Icons.jsx'
import styles from './Banner.module.css'

const VARIANT_ICON = {
  warning: '⚠️',
  info: 'ℹ️',
}

export default function Banner({ variant = 'success', children }) {
  const isSimpleText = typeof children === 'string'

  return (
    <div className={`${styles.banner} ${styles[variant] ?? ''}`}>
      <span className={styles.iconDot}>
        {variant === 'success' ? <CheckIcon className={styles.icon} /> : VARIANT_ICON[variant]}
      </span>
      <div className={styles.body}>{isSimpleText ? <p className={styles.text}>{children}</p> : children}</div>
    </div>
  )
}
