import styles from './Select.module.css'

export default function Select({ icon, name, value, onChange, options, placeholder, error }) {
  return (
    <div className={styles.field}>
      <div className={`${styles.wrapper} ${error ? styles.wrapperError : ''}`}>
        <select
          className={`${styles.select} ${value ? styles.hasValue : ''}`}
          name={name}
          value={value}
          onChange={onChange}
          aria-label={placeholder}
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
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
