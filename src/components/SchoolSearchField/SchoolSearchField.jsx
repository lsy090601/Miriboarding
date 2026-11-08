import { useEffect, useRef, useState } from 'react'
import Input from '../Input/Input.jsx'
import { searchSchools } from '../../lib/api.js'
import styles from './SchoolSearchField.module.css'

// 학교명을 입력하면 교육부 NEIS 학교기본정보(서버 GET /api/schools)로 검색해서
// 입력칸 아래 목록으로 보여주고, 클릭하면 학교명이 채워진다.
// 목록에 없는 학교나 검색 서비스 장애일 때도 가입이 막히지 않도록 직접 입력한 값도 그대로 쓸 수 있다.
export default function SchoolSearchField({ name, value, onChange, placeholder, error, icon }) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const requestId = useRef(0)
  const pickedName = useRef('')
  const rootRef = useRef(null)

  useEffect(() => {
    const query = value.trim()
    const id = ++requestId.current
    if (query.length < 2 || query === pickedName.current) {
      setResults([])
      setLoading(false)
      setSearched(false)
      setSearchFailed(false)
      return undefined
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchSchools(query)
        if (id !== requestId.current) return
        setResults(data?.schools ?? [])
        setSearchFailed(false)
      } catch {
        if (id !== requestId.current) return
        setResults([])
        setSearchFailed(true)
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          setSearched(true)
          setActiveIndex(-1)
        }
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  useEffect(() => {
    function handleOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleInputChange(event) {
    pickedName.current = ''
    setOpen(true)
    onChange(event)
  }

  function pick(school) {
    pickedName.current = school.name
    onChange({ target: { name, value: school.name } })
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event) {
    if (!open || results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      pick(results[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const query = value.trim()
  const showList = open && query.length >= 2 && query !== pickedName.current && (loading || searched)

  return (
    <div className={styles.root} ref={rootRef} onKeyDown={handleKeyDown}>
      <Input
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        error={error}
        icon={icon}
        autoComplete="off"
      />
      {showList && (
        <ul className={styles.list} role="listbox">
          {loading && <li className={styles.message}>학교를 검색하는 중이에요...</li>}
          {!loading && searchFailed && (
            <li className={styles.message}>학교 목록을 불러오지 못했어요. 학교명을 직접 입력해주세요.</li>
          )}
          {!loading && !searchFailed && results.length === 0 && (
            <li className={styles.message}>검색 결과가 없어요. 입력한 학교명 그대로 가입할 수 있어요.</li>
          )}
          {!loading &&
            results.map((school, index) => (
              <li
                key={school.code ?? `${school.name}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.item} ${index === activeIndex ? styles.itemActive : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  pick(school)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className={styles.name}>{school.name}</span>
                <span className={styles.meta}>
                  {[school.type, school.region, school.address].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
