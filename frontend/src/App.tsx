import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay, ModuleSwitcher } from './components/organisms'
import { useLoading } from './context/LoadingContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import './App.css'

import { useAuth } from './auth/AuthContext'

// Route components are code-split: each page (and its heavy deps — maps, charts,
// signalr) loads on demand, keeping the initial bundle small.
const named = <T,>(p: Promise<Record<string, T>>, key: string) => p.then((m) => ({ default: m[key] as T }))

const AccessLevelsPage = lazy(() => named(import('./pages/AccessLevelsPage'), 'AccessLevelsPage'))
const MonitoringPage = lazy(() => named(import('./pages/MonitoringPage'), 'MonitoringPage'))
const LoginPage = lazy(() => named(import('./pages/LoginPage'), 'LoginPage'))
const SetupPasswordPage = lazy(() => named(import('./pages/SetupPasswordPage'), 'SetupPasswordPage'))
const ForgotPasswordPage = lazy(() => named(import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => named(import('./pages/ResetPasswordPage'), 'ResetPasswordPage'))
const PayrollCalculationPage = lazy(() => named(import('./pages/PayrollCalculationPage'), 'PayrollCalculationPage'))
const PeopleManagementPage = lazy(() => named(import('./pages/PeopleManagementPage'), 'PeopleManagementPage'))
const PersonDetailPage = lazy(() => named(import('./pages/PersonDetailPage'), 'PersonDetailPage'))
const SystemSettingsPage = lazy(() => named(import('./pages/SystemSettingsPage'), 'SystemSettingsPage'))
const SystemStatusPage = lazy(() => named(import('./pages/SystemStatusPage'), 'SystemStatusPage'))
const WorkHoursTrackingPage = lazy(() => named(import('./pages/WorkHoursTrackingPage'), 'WorkHoursTrackingPage'))
const SchedulePlannerPage = lazy(() => named(import('./pages/SchedulePlannerPage'), 'SchedulePlannerPage'))
const AttendanceApprovalsPage = lazy(() => named(import('./pages/AttendanceApprovalsPage'), 'AttendanceApprovalsPage'))
const GeoZonesPage = lazy(() => named(import('./pages/GeoZonesPage'), 'GeoZonesPage'))
const DashboardPage = lazy(() => named(import('./pages/DashboardPage'), 'DashboardPage'))
const SelfServicePage = lazy(() => named(import('./pages/SelfServicePage'), 'SelfServicePage'))
const GymCustomersPage = lazy(() => named(import('./pages/gym'), 'GymCustomersPage'))
const GymSubscriptionsPage = lazy(() => named(import('./pages/gym'), 'GymSubscriptionsPage'))
const GymInventoryPage = lazy(() => named(import('./pages/gym'), 'GymInventoryPage'))
const GymFinancePage = lazy(() => named(import('./pages/gym'), 'GymFinancePage'))
const GymAnalyticsPage = lazy(() => named(import('./pages/gym'), 'GymAnalyticsPage'))
const GymPosPage = lazy(() => named(import('./pages/gym'), 'GymPosPage'))
const ParkingManagementPage = lazy(() => named(import('./pages/parking'), 'ParkingManagementPage'))

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
      <Suspense fallback={<LoadingOverlay isLoading variant="overlay" message={t('common.loading')} />}>
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

          {/* ─── Gym Management module ─── */}
          <Route path="/gym/customers" element={<GymCustomersPage />} />
          <Route path="/gym/subscriptions" element={<GymSubscriptionsPage />} />
          <Route path="/gym/inventory" element={<GymInventoryPage />} />
          <Route path="/gym/finance" element={<GymFinancePage />} />
          <Route path="/gym/analytics" element={<GymAnalyticsPage />} />
          <Route path="/gym/pos" element={<GymPosPage />} />

          {/* ─── Parking Management module ─── */}
          <Route path="/parking/management" element={<ParkingManagementPage />} />

          <Route path="/settings" element={<SystemSettingsPage />} />
          <Route path="/status" element={<SystemStatusPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>

      {/* Full-screen module picker overlay (opened from the sidebar module card) */}
      <ModuleSwitcher />
    </>
  )
}

export default App
