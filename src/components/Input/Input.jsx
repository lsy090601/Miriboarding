import { useState } from 'react'
import { UnlockIcon } from '../icons/Icons.jsx'
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
  // 비밀번호 칸의 자물쇠 아이콘을 누르면 입력한 비밀번호가 그대로 보이고, 다시 누르면 가려진다.
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isPassword = type === 'password' && !multiline
  const inputType = isPassword && passwordVisible ? 'text' : type

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
            type={inputType}
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
        {icon && !multiline && isPassword && (
          <button
            type="button"
            className={`${styles.icon} ${styles.iconButton}`}
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? <UnlockIcon /> : icon}
          </button>
        )}
        {icon && !multiline && !isPassword && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
