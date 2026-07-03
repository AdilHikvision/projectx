import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLoading } from '../context/LoadingContext'
import { Button, Input, Logo } from '../components/atoms'
import { apiRequest } from '../lib/api'

interface SetupRequiredResponse {
  required: boolean
  email?: string
}

export function SetupPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    apiRequest<SetupRequiredResponse>('/api/auth/setup-required')
      .then((res) => {
        if (cancelled) return
        if (!res.required) {
          navigate('/login', { replace: true })
          return
        }
        setEmail(res.email ?? '')
      })
      .catch(() => {
        if (cancelled) return
        navigate('/login', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => { cancelled = true }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email?.trim()) {
      setError(t('auth.pleaseEnterEmail'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordMinLength'))
      return
    }
    startLoading()
    try {
      await apiRequest('/api/auth/setup-admin-password', {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword }),
      })
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || t('auth.failedToSetPassword'))
    } finally {
      stopLoading()
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-light" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] animate-pulse">{t('auth.initializingSetup')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light dot-background font-sans antialiased text-text-dark">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-primary-light/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 animate-fade-up">
        <div className="bg-white rounded-3xl shadow-float border border-border-light p-8 sm:p-10 space-y-8 relative overflow-hidden">

          <div className="flex flex-col items-center text-center space-y-4">
            <Logo size={48} />
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-dark">{t('auth.setupTitle')}</h1>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-light leading-relaxed">{t('auth.setupSubtitle')}</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-error-bg text-error-text rounded-xl text-xs font-semibold text-center animate-pop">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.adminEmail')}</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={t('auth.adminEmailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    className="pl-12"
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.masterPassword')}</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.masterPasswordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      className="pl-12 pr-12"
                      required
                      minLength={8}
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

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.confirmPasswordLabel')}</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.repeatMasterPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="lg"
                      className="pl-12 pr-12"
                      required
                      minLength={8}
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">shield</span>
                    <button
                      type="button"
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors text-xl"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="h-12 rounded-xl text-sm"
              >
                {t('auth.completeSetup')}
              </Button>
            </div>
          </form>

          <div className="pt-4 text-center">
            <p className="text-text-light/50 text-[9px] font-extrabold uppercase tracking-[0.3em]">{t('auth.poweredBy')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
