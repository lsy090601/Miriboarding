import Button from '../Button/Button.jsx'
import styles from './RoleToggle.module.css'

export default function RoleToggle({ value, onChange }) {
  return (
    <div className={styles.row}>
      <Button variant={value === 'student' ? 'toggleActive' : 'outline'} onClick={() => onChange('student')}>
        student
      </Button>
      <Button variant={value === 'company' ? 'toggleActive' : 'outline'} onClick={() => onChange('company')}>
        company
      </Button>
    </div>
  )
}
