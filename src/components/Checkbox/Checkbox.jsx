import styles from './Checkbox.module.css'

export default function Checkbox({ id, checked, onChange, children }) {
  return (
    <label className={styles.row} htmlFor={id}>
      <input id={id} type="checkbox" className={styles.checkbox} checked={checked} onChange={onChange} />
      <span className={styles.label}>{children}</span>
    </label>
  )
}
