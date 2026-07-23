import Checkbox from '../Checkbox/Checkbox.jsx'
import styles from './TermsCheckboxes.module.css'

export default function TermsCheckboxes({ value, onChange, error }) {
  function toggle(key) {
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div className={styles.group}>
      <Checkbox id="terms-tos" checked={value.tos} onChange={() => toggle('tos')}>
        [필수] 이용약관에 동의합니다
      </Checkbox>
      <Checkbox id="terms-privacy" checked={value.privacy} onChange={() => toggle('privacy')}>
        [필수] 개인정보 수집 및 이용에 동의합니다
      </Checkbox>
      <Checkbox id="terms-age" checked={value.age} onChange={() => toggle('age')}>
        [필수] 만 14세 이상입니다
      </Checkbox>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
