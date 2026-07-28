import styles from './Chip.module.css'

export default function Chip({ onClick, children }) {
  return (
    <button type="button" className={styles.chip} onClick={onClick}>
      {children}
    </button>
  )
}
