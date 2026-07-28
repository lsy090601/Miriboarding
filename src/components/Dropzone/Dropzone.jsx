import { useState } from 'react'
import styles from './Dropzone.module.css'

export default function Dropzone({ fileName, onChange, placeholder = '파일을 드래그하거나 클릭해서 선택하세요' }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onChange(file)
  }

  function handleSelect(e) {
    const file = e.target.files?.[0]
    if (file) onChange(file)
  }

  return (
    <label
      className={`${styles.dropzone} ${isDraggingOver ? styles.active : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDraggingOver(true)
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <input type="file" className={styles.input} onChange={handleSelect} />
      <span className={styles.icon}>📎</span>
      <span className={styles.text}>{fileName || placeholder}</span>
    </label>
  )
}
