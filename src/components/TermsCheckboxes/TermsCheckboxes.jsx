import Checkbox from '../Checkbox/Checkbox.jsx'
import styles from './TermsCheckboxes.module.css'

const TERMS = [
  { key: 'tos', required: true, label: '서비스 이용약관 동의' },
  { key: 'privacy', required: true, label: '개인정보 수집·이용 동의' },
  { key: 'age', required: true, label: '만 14세 이상입니다' },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
]

export default function TermsCheckboxes({ value, onChange, error }) {
  function toggle(key) {
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div className={styles.group}>
      {TERMS.map((term) => (
        <Checkbox
          key={term.key}
          id={`terms-${term.key}`}
          checked={!!value[term.key]}
          onChange={() => toggle(term.key)}
        >
          <span className={`${styles.tag} ${term.required ? styles.required : styles.optional}`}>
            {term.required ? '[필수]' : '[선택]'}
          </span>
          <span className={styles.text}>{term.label}</span>
        </Checkbox>
      ))}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
