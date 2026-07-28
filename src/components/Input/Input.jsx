import styles from './Input.module.css'

export default function Input({
  icon,
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  autoComplete,
  inputMode,
  id,
}) {
  const fieldId = id ?? name

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''}`}>
        <input
          id={fieldId}
          className={styles.input}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label={label ?? placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
        />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
