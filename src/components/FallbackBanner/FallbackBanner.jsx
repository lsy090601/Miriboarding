import styles from './FallbackBanner.module.css'

export default function FallbackBanner({ children }) {
  return (
    <div className={styles.banner}>
      ⚠️ {children ?? '서버 연결에 실패해서 mock 데이터로 표시 중이에요.'}
    </div>
  )
}
