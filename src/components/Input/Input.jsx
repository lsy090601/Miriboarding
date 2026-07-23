import styles from './Input.module.css'

export default function Input({
  icon,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoComplete,
  inputMode,
}) {
  return (
    <div className={styles.field}>
      <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''}`}>
        <input
          className={styles.input}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
        />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
