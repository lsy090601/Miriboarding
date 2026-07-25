import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage.jsx'
import RoleSelectPage from './pages/Signup/RoleSelectPage.jsx'
import StudentSignupPage from './pages/Signup/StudentSignupPage.jsx'
import CompanySignupPage from './pages/Signup/CompanySignupPage.jsx'
import StudentHome from './pages/student/StudentHome.jsx'
import JobList from './pages/student/JobList.jsx'
import JobSchedule from './pages/student/JobSchedule.jsx'
import ScheduleDetail from './pages/student/ScheduleDetail.jsx'
import OnboardingHome from './pages/student/OnboardingHome.jsx'
import OnboardingSchedule from './pages/student/OnboardingSchedule.jsx'
import MissionList from './pages/student/MissionList.jsx'
import MissionDetail from './pages/student/MissionDetail.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RoleSelectPage />} />
      <Route path="/signup/student" element={<StudentSignupPage />} />
      <Route path="/signup/company" element={<CompanySignupPage />} />
      <Route path="/student/home" element={<StudentHome />} />
      <Route path="/student/explore" element={<JobList />} />
      <Route path="/student/explore/:jobId" element={<JobSchedule />} />
      <Route path="/student/explore/:jobId/detail/:scheduleId" element={<ScheduleDetail />} />
      <Route path="/student/onboarding/:companyId" element={<OnboardingHome />} />
      <Route path="/student/onboarding/:companyId/explore" element={<OnboardingSchedule />} />
      <Route path="/student/onboarding/:companyId/missions" element={<MissionList />} />
      <Route path="/student/onboarding/:companyId/missions/:missionId" element={<MissionDetail />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
