import styles from './VerificationBadge.module.css'

const LABEL = {
  verified: '검증됨',
  invalid: '검증 실패',
  unavailable: '사용 불가',
}

export default function VerificationBadge({ status }) {
  if (!status || !LABEL[status]) return null
  return <span className={`${styles.badge} ${styles[status]}`}>{LABEL[status]}</span>
}
