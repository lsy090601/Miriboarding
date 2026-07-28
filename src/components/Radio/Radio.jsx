import styles from './Radio.module.css'

export default function Radio({ id, name, value, checked, onChange, children }) {
  return (
    <label className={styles.row} htmlFor={id}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={styles.input}
      />
      <span className={styles.dot} />
      <span className={styles.label}>{children}</span>
    </label>
  )
}
