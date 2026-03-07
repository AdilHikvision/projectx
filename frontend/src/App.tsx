import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingOverlay } from './components/LoadingOverlay'
import { useLoading } from './context/LoadingContext'
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
  const { isLoading } = useLoading()

  return (
    <>
    <LoadingOverlay isLoading={isLoading} />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/people" element={<PeopleManagementPage />} />
        <Route path="/access-levels" element={<AccessLevelsPage />} />
        <Route path="/work-hours" element={<WorkHoursTrackingPage />} />
        <Route path="/payroll" element={<PayrollCalculationPage />} />
        <Route path="/settings" element={<SystemSettingsPage />} />
        <Route path="/status" element={<SystemStatusPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/devices" replace />} />
    </Routes>
    </>
  )
}

export default App
