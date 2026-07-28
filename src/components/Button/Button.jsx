import styles from './Button.module.css'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant] ?? ''} ${styles[size] ?? ''} ${className}`}
    >
      {children}
    </button>
  )
}
