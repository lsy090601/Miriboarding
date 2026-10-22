import { ArrowLeftIcon } from '../icons/Icons.jsx'
import styles from './BackLink.module.css'

export default function BackLink({ onClick, children = '돌아가기' }) {
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      <span className={styles.icon}>
        <ArrowLeftIcon />
      </span>
      <span>{children}</span>
    </button>
  )
}
