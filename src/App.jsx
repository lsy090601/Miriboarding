import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage.jsx'
import RoleSelectPage from './pages/Signup/RoleSelectPage.jsx'
import StudentSignupPage from './pages/Signup/StudentSignupPage.jsx'
import CompanySignupPage from './pages/Signup/CompanySignupPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RoleSelectPage />} />
      <Route path="/signup/student" element={<StudentSignupPage />} />
      <Route path="/signup/company" element={<CompanySignupPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
