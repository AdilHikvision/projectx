import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { DevicesPage } from './pages/DevicesPage'
import { LoginPage } from './pages/LoginPage'
import { SystemStatusPage } from './pages/SystemStatusPage'
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
        <Route path="/system" element={<SystemStatusPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/devices" replace />} />
    </Routes>
  )
}

export default App
