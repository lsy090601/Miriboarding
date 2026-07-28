import styles from './RoleToggle.module.css'

const ROLES = [
  {
    value: 'student',
    emoji: '🎓',
    title: '학생',
    description: ['마이스터고 재학생·졸업생', '직무 체험과 온보딩을 이용해요'],
  },
  {
    value: 'company',
    emoji: '🏢',
    title: '기업',
    description: ['신입 사원을 맞이하는 회사', '온보딩을 만들고 관리해요'],
  },
]

export default function RoleToggle({ value, onChange }) {
  return (
    <div className={styles.row} role="radiogroup" aria-label="가입 유형">
      {ROLES.map((role) => {
        const active = value === role.value
        return (
          <button
            key={role.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.card} ${active ? styles.active : ''}`}
            onClick={() => onChange(role.value)}
          >
            <span className={styles.top}>
              <span className={styles.icon}>{role.emoji}</span>
              <span className={`${styles.radio} ${active ? styles.radioActive : ''}`} />
            </span>
            <span className={styles.title}>{role.title}</span>
            <span className={styles.description}>
              {role.description.map((line) => (
                <span key={line} className={styles.line}>
                  {line}
                </span>
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
