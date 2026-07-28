import { ChevronDownIcon } from '../icons/Icons.jsx'
import styles from './Select.module.css'

export default function Select({ label, name, value, onChange, options, placeholder, error, id }) {
  const fieldId = id ?? name

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''}`}>
        <select
          id={fieldId}
          className={`${styles.select} ${value ? styles.hasValue : ''}`}
          name={name}
          value={value}
          onChange={onChange}
          aria-label={label ?? placeholder}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className={styles.chevron}>
          <ChevronDownIcon />
        </span>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
