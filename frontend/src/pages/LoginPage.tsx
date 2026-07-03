import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { useLoading } from '../context/LoadingContext'
import { Button, Input, Logo } from '../components/atoms'
import { Modal } from '../components/organisms'
import { apiRequest, consumeSessionExpiredFlag } from '../lib/api'

interface SetupRequiredResponse {
  required: boolean
}

type LoginTab = 'staff' | 'self-service'

const SELF_SERVICE_TOKEN_KEY = 'projectx.ss.token'
const SELF_SERVICE_USER_KEY = 'projectx.ss.user'

export function LoginPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<LoginTab>('staff')

  // Staff login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false)
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  const { login, isAuthenticated } = useAuth()

  // Self-service login state
  const [ssEmail, setSsEmail] = useState('')
  const [ssPassword, setSsPassword] = useState('')
  const [ssShowPassword, setSsShowPassword] = useState(false)
  const [ssError, setSsError] = useState<string | null>(null)
  const [ssLoading, setSsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (consumeSessionExpiredFlag()) {
      setShowSessionExpiredDialog(true)
    }
  }, [])

  useEffect(() => {
    apiRequest<SetupRequiredResponse>('/api/auth/setup-required')
      .then((res) => setSetupRequired(res.required))
      .catch(() => setSetupRequired(false))
  }, [])

  if (setupRequired === null) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background-light" aria-busy="true">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
      </div>
    )
  }

  if (setupRequired === true) {
    return <Navigate to="/setup-password" replace />
  }

  if (isAuthenticated) {
    return <Navigate to="/devices" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startLoading()
    setError(null)
    try {
      await login({ email, password })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg && (msg.includes('500') || msg.includes('Authentication service') || msg.includes('error')) ? msg : t('auth.invalidCredentials'))
    } finally {
      stopLoading()
    }
  }

  const handleSelfServiceLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSsLoading(true)
    setSsError(null)
    try {
      const res = await apiRequest<{ token: string; employeeId: string; requiresPasswordSetup: boolean }>('/api/self-service/login', {
        method: 'POST',
        body: JSON.stringify({ email: ssEmail, password: ssPassword }),
      })
      localStorage.setItem(SELF_SERVICE_TOKEN_KEY, res.token)
      localStorage.setItem(SELF_SERVICE_USER_KEY, JSON.stringify({ employeeId: res.employeeId, requiresPasswordSetup: res.requiresPasswordSetup, currentPassword: ssPassword }))
      navigate('/self-service')
    } catch {
      setSsError(t('auth.selfServiceInvalidCredentials'))
    } finally {
      setSsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light dot-background font-sans antialiased text-text-dark">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-primary-light/10 rounded-full blur-3xl pointer-events-none" />

      <Modal isOpen={showSessionExpiredDialog} onClose={() => setShowSessionExpiredDialog(false)} title={t('auth.sessionExpiredTitle')}>
        <div className="space-y-6 py-2 text-center">
          <div className="w-16 h-16 bg-warning-bg text-warning-text rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-3xl">timer_off</span>
          </div>
          <p className="text-sm font-medium text-text-dark leading-relaxed">
            {t('auth.sessionExpiredMessage')}
          </p>
          <Button fullWidth onClick={() => setShowSessionExpiredDialog(false)}>{t('common.ok')}</Button>
        </div>
      </Modal>

      <div className="w-full max-w-[440px] relative z-10 animate-fade-up">
        <div className="bg-white rounded-3xl shadow-float border border-border-light p-8 sm:p-10 space-y-6 relative overflow-hidden">

          {/* Branding */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Logo size={48} />
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-dark">{t('auth.signInUpper')}</h1>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex rounded-xl bg-slate-75 p-1 gap-1">
            <button
              type="button"
              onClick={() => { setTab('staff'); setError(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[10px] font-extrabold uppercase tracking-[0.14em] transition-all ${
                tab === 'staff' ? 'bg-white text-primary shadow-card' : 'text-text-light hover:text-text-dark'
              }`}
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              {t('auth.staff')}
            </button>
            <button
              type="button"
              onClick={() => { setTab('self-service'); setSsError(null) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[10px] font-extrabold uppercase tracking-[0.14em] transition-all ${
                tab === 'self-service' ? 'bg-white text-primary shadow-card' : 'text-text-light hover:text-text-dark'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              {t('auth.selfService')}
            </button>
          </div>

          {/* Staff Login Form */}
          {tab === 'staff' && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 bg-error-bg text-error-text rounded-xl text-xs font-semibold text-center animate-pop">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.emailAddress')}</label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                      className="pl-12"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">alternate_email</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em]">{t('auth.password')}</label>
                    <Link to="/forgot-password" className="text-[9px] font-extrabold text-primary hover:underline uppercase tracking-[0.14em] transition-colors">{t('auth.forgot')}</Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      className="pl-12 pr-12"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">lock</span>
                    <button
                      type="button"
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors text-xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="h-12 rounded-xl text-sm"
              >
                {t('auth.signIn')}
              </Button>
            </form>
          )}

          {/* Self-Service Login Form */}
          {tab === 'self-service' && (
            <form className="space-y-5" onSubmit={handleSelfServiceLogin}>
              {ssError && (
                <div className="p-3.5 bg-error-bg text-error-text rounded-xl text-xs font-semibold text-center animate-pop">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {ssError}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.email')}</label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={t('auth.selfServiceEmailPlaceholder')}
                      value={ssEmail}
                      onChange={(e) => setSsEmail(e.target.value)}
                      size="lg"
                      className="pl-12"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">alternate_email</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.password')}</label>
                  <div className="relative">
                    <Input
                      type={ssShowPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={ssPassword}
                      onChange={(e) => setSsPassword(e.target.value)}
                      size="lg"
                      className="pl-12 pr-12"
                      required
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">lock</span>
                    <button
                      type="button"
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors text-xl"
                      onClick={() => setSsShowPassword(!ssShowPassword)}
                    >
                      {ssShowPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                isLoading={ssLoading}
                fullWidth
                size="lg"
                className="h-12 rounded-xl text-sm"
              >
                {t('auth.signIn')}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
