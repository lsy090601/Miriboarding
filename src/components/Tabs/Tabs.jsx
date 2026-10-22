import styles from './Tabs.module.css'

export default function Tabs({ items, active, onChange, variant = 'default' }) {
  return (
    <div
      className={`${styles.row} ${variant === 'segmented' ? styles.segmented : ''}`}
      role="tablist"
      style={variant === 'segmented' ? { '--tab-count': items.length } : undefined}
    >
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
