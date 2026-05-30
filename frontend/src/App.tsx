import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from './components/organisms'
import { useLoading } from './context/LoadingContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AccessLevelsPage } from './pages/AccessLevelsPage'

import { MonitoringPage } from './pages/MonitoringPage'
import { LoginPage } from './pages/LoginPage'
import { SetupPasswordPage } from './pages/SetupPasswordPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { PayrollCalculationPage } from './pages/PayrollCalculationPage'
import { PeopleManagementPage } from './pages/PeopleManagementPage'
import { PersonDetailPage } from './pages/PersonDetailPage'
import { SystemSettingsPage } from './pages/SystemSettingsPage'
import { SystemStatusPage } from './pages/SystemStatusPage'
import { WorkHoursTrackingPage } from './pages/WorkHoursTrackingPage'
import { SchedulePlannerPage } from './pages/SchedulePlannerPage'
import { AttendanceApprovalsPage } from './pages/AttendanceApprovalsPage'
import { GeoZonesPage } from './pages/GeoZonesPage'
import { DashboardPage } from './pages/DashboardPage'
import { SelfServicePage } from './pages/SelfServicePage'
import './App.css'

import { useAuth } from './auth/AuthContext'

function App() {
  const { isLoading: globalLoading } = useLoading()
  const { isLoading: authLoading } = useAuth()
  const { t } = useTranslation()

  return (
    <>
      <LoadingOverlay
        isLoading={globalLoading || authLoading}
        variant={authLoading ? 'solid' : 'overlay'}
        message={authLoading ? t('common.checkingSession') : t('common.loading')}
      />
      <Routes>
        <Route path="/setup-password" element={<SetupPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Self-service portal — independent auth, no ProtectedRoute */}
        <Route path="/self-service" element={<SelfServicePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/people" element={<PeopleManagementPage />} />
          <Route path="/people/:type/:id" element={<PersonDetailPage />} />
          <Route path="/access-levels" element={<AccessLevelsPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/work-hours" element={<WorkHoursTrackingPage />} />
          <Route path="/schedule-planner" element={<SchedulePlannerPage />} />
          <Route path="/approvals" element={<AttendanceApprovalsPage />} />
          <Route path="/geo-zones" element={<GeoZonesPage />} />
          <Route path="/payroll" element={<PayrollCalculationPage />} />
          <Route path="/settings" element={<SystemSettingsPage />} />
          <Route path="/status" element={<SystemStatusPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
