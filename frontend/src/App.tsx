import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingOverlay } from './components/LoadingOverlay'
import { useLoading } from './context/LoadingContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AccessLevelsPage } from './pages/AccessLevelsPage'
import { DevicesPage } from './pages/DevicesPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { LoginPage } from './pages/LoginPage'
import { SetupPasswordPage } from './pages/SetupPasswordPage'
import { PayrollCalculationPage } from './pages/PayrollCalculationPage'
import { PeopleManagementPage } from './pages/PeopleManagementPage'
import { PersonDetailPage } from './pages/PersonDetailPage'
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
      <Route path="/setup-password" element={<SetupPasswordPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/people" element={<PeopleManagementPage />} />
        <Route path="/people/:type/:id" element={<PersonDetailPage />} />
        <Route path="/access-levels" element={<AccessLevelsPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
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
