import styles from './Tabs.module.css'

export default function Tabs({ items, active, onChange }) {
  return (
    <div className={styles.row} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={`${styles.tab} ${active === item.key ? styles.active : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
