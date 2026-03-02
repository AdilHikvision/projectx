import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AccessLevelsPage } from './pages/AccessLevelsPage'
import { DevicesPage } from './pages/DevicesPage'
import { LoginPage } from './pages/LoginPage'
import { PayrollCalculationPage } from './pages/PayrollCalculationPage'
import { PeopleManagementPage } from './pages/PeopleManagementPage'
import { SystemSettingsPage } from './pages/SystemSettingsPage'
import { SystemStatusPage } from './pages/SystemStatusPage'
import { WorkHoursTrackingPage } from './pages/WorkHoursTrackingPage'
import './App.css'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div className="page-message">Загрузка...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/people" element={<PeopleManagementPage />} />
        <Route path="/access-levels" element={<AccessLevelsPage />} />
        <Route path="/work-hours" element={<WorkHoursTrackingPage />} />
        <Route path="/payroll" element={<PayrollCalculationPage />} />
        <Route path="/settings" element={<SystemSettingsPage />} />
        <Route path="/system-status" element={<SystemStatusPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/devices" replace />} />
    </Routes>
  )
}

export default App
