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
  multiline = false,
  rows = 4,
}) {
  const fieldId = id ?? name

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div
        className={`${styles.wrapper} ${multiline ? styles.wrapperMultiline : ''} ${error ? styles.wrapperError : ''}`}
      >
        {multiline ? (
          <textarea
            id={fieldId}
            className={styles.textarea}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-label={label ?? placeholder}
            rows={rows}
          />
        ) : (
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
        )}
        {icon && !multiline && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
