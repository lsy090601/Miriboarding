import { Fragment } from 'react'
import styles from './Stepper.module.css'

export default function Stepper({ current, total, label }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {Array.from({ length: total }).map((_, i) => {
          const step = i + 1
          return (
            <Fragment key={step}>
              <span className={`${styles.node} ${step <= current ? styles.filled : ''}`}>{step}</span>
              {step < total && <span className={`${styles.line} ${step + 1 <= current ? styles.filled : ''}`} />}
            </Fragment>
          )
        })}
      </div>
      {label && (
        <span className={styles.label}>
          {current}/{total} · {label}
        </span>
      )}
    </div>
  )
}
