import styles from './ImageCard.module.css'

/**
 * 배경 이미지 + 하단 그라데이션 위에 제목/설명을 올린 카드 (Figma 홈·직무체험·온보딩 카드)
 * size: 'lg' (560x400) | 'md' (366x230) | 'square' (270x270)
 */
export default function ImageCard({ image, title, description, size = 'md', onClick }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[size] ?? ''}`}
      style={image ? { '--card-image': `url("${image}")` } : undefined}
      onClick={onClick}
    >
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </button>
  )
}
