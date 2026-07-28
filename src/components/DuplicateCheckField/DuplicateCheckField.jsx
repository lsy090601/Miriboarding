import Input from '../Input/Input.jsx'
import Button from '../Button/Button.jsx'
import styles from './DuplicateCheckField.module.css'

export default function DuplicateCheckField({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  status,
  checking,
  onCheck,
}) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
      )}
      <div className={styles.row}>
        <Input
          id={name}
          icon={icon}
          type="email"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error}
          autoComplete="email"
        />
        <Button type="button" variant="outline" className={styles.checkButton} onClick={onCheck} disabled={checking}>
          {checking ? '확인 중...' : '중복 확인'}
        </Button>
      </div>
      {status === 'available' && <p className={styles.successText}>사용 가능한 이메일입니다.</p>}
      {status === 'taken' && <p className={styles.takenText}>이미 사용 중인 이메일입니다.</p>}
    </div>
  )
}
