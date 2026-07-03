import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLoading } from '../context/LoadingContext'
import { Button, Input, Logo } from '../components/atoms'
import { apiRequest } from '../lib/api'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [token, setToken] = useState(() => searchParams.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email?.trim()) {
      setError(t('auth.enterEmail'))
      return
    }
    if (!token?.trim()) {
      setError(t('auth.enterToken'))
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
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          password,
          confirmPassword,
        }),
      })
      setSuccess(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || t('auth.passwordResetFailed'))
    } finally {
      stopLoading()
    }
  }

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light dot-background font-sans antialiased text-text-dark">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-primary-light/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10 animate-fade-up">
          <div className="bg-white rounded-3xl shadow-float border border-border-light p-8 sm:p-10 space-y-8 relative overflow-hidden">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-success-bg flex items-center justify-center text-success-text animate-pop">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-text-dark">{t('auth.passwordUpdatedTitle')}</h1>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-light">{t('auth.passwordUpdatedSubtitle')}</p>
              </div>
            </div>
            <Link to="/login" className="block">
              <Button fullWidth size="lg" className="h-12 rounded-xl text-sm">
                {t('auth.signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light dot-background font-sans antialiased text-text-dark">
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-primary-light/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-up">
        <div className="bg-white rounded-3xl shadow-float border border-border-light p-8 sm:p-10 space-y-8 relative overflow-hidden">

          <div className="flex flex-col items-center text-center space-y-4">
            <Logo size={48} />
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-dark">{t('auth.newPasswordTitle')}</h1>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-light">{t('auth.newPasswordSubtitle')}</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.email')}</label>
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.resetTokenLabel')}</label>
                <Input
                  type="text"
                  placeholder={t('auth.resetTokenPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  size="lg"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.newPasswordLabel')}</label>
                <Input
                  type="password"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.confirmPasswordLabel')}</label>
                <Input
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="lg"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              size="lg"
              className="h-12 rounded-xl text-sm"
            >
              {t('auth.resetPasswordButton')}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <Link to="/forgot-password" className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-[0.14em]">
              {t('auth.requestNewToken')}
            </Link>
            <span className="text-text-light/50 mx-2">|</span>
            <Link to="/login" className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-[0.14em]">
              {t('auth.backToSignInPlain')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
