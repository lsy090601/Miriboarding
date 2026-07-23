import { getPasswordStrength } from '../../utils/validation.js'
import styles from './PasswordStrengthMeter.module.css'

const LABEL = { weak: '약함', medium: '보통', strong: '강함' }

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null
  const strength = getPasswordStrength(password)

  return (
    <div className={styles.meter}>
      <div className={styles.track}>
        <div className={`${styles.fill} ${styles[strength]}`} />
      </div>
      <span className={`${styles.label} ${styles[strength]}`}>{LABEL[strength]}</span>
    </div>
  )
}
