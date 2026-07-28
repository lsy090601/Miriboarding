import { CheckIcon } from '../icons/Icons.jsx'
import styles from './Checkbox.module.css'

export default function Checkbox({ id, checked, onChange, children }) {
  return (
    <label className={styles.row} htmlFor={id}>
      <input id={id} type="checkbox" className={styles.input} checked={checked} onChange={onChange} />
      <span className={styles.box}>
        <CheckIcon className={styles.check} />
      </span>
      <span className={styles.label}>{children}</span>
    </label>
  )
}
