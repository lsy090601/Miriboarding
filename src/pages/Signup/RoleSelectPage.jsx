import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout/AuthLayout.jsx'
import Input from '../../components/Input/Input.jsx'
import Button from '../../components/Button/Button.jsx'
import RoleToggle from '../../components/RoleToggle/RoleToggle.jsx'
import { MailIcon, LockIcon, UserIcon } from '../../components/icons/Icons.jsx'
import { isValidEmail, isValidPassword, doPasswordsMatch, isRequired } from '../../utils/validation.js'
import styles from './SignupForm.module.css'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', name: '', password: '', confirmPassword: '' })
  const [role, setRole] = useState(null)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const nextErrors = {}
    if (!isRequired(form.email)) nextErrors.email = '이메일을 입력해주세요.'
    else if (!isValidEmail(form.email)) nextErrors.email = '올바른 이메일 형식이 아닙니다.'
    if (!isRequired(form.name)) nextErrors.name = '이름을 입력해주세요.'
    if (!isValidPassword(form.password)) nextErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!doPasswordsMatch(form.password, form.confirmPassword)) nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    if (!role) nextErrors.role = '학생 또는 기업을 선택해주세요.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    console.log('signup role select', { ...form, role })
    const target = role === 'company' ? '/signup/company?step=1' : `/signup/${role}`
    navigate(target, { state: { ...form } })
  }

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          name="email"
          type="email"
          placeholder="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          icon={<MailIcon />}
          autoComplete="email"
        />
        <Input
          name="name"
          type="text"
          placeholder="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          icon={<UserIcon />}
          autoComplete="name"
        />
        <Input
          name="password"
          type="password"
          placeholder="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          icon={<LockIcon />}
          autoComplete="new-password"
        />
        <RoleToggle value={role} onChange={setRole} />
        {errors.role && <p className={styles.roleError}>{errors.role}</p>}
        <Button type="submit" variant="primary" className={styles.submit}>
          next
        </Button>
      </form>
    </AuthLayout>
  )
}
