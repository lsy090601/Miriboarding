import styles from './Button.module.css'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant] ?? ''} ${className}`}
    >
      {children}
    </button>
  )
}
