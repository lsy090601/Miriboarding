import styles from './Modal.module.css'

export default function Modal({ title, onClose, children, closeLabel }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {closeLabel ? (
          <button type="button" className={styles.closeLink} onClick={onClose}>
            {closeLabel}
          </button>
        ) : (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
        )}
        <div className={closeLabel ? styles.bodyCentered : styles.body}>{children}</div>
      </div>
    </div>
  )
}
