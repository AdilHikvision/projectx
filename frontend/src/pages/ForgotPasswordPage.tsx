import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLoading } from '../context/LoadingContext'
import { Button, Input, Logo } from '../components/atoms'
import { apiRequest } from '../lib/api'

interface ForgotPasswordResponse {
  message: string
  token?: string
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; token?: string } | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!email?.trim()) {
      setError(t('auth.enterEmail'))
      return
    }
    startLoading()
    try {
      const res = await apiRequest<ForgotPasswordResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.token) {
        const params = new URLSearchParams({ email: email.trim(), token: res.token })
        navigate(`/reset-password?${params.toString()}`, { replace: true })
      } else {
        setSuccess(res)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || t('auth.passwordResetRequestFailed'))
    } finally {
      stopLoading()
    }
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
              <h1 className="text-2xl font-extrabold tracking-tight text-text-dark">{t('auth.forgotPasswordTitle')}</h1>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-light">{t('auth.forgotPasswordSubtitle')}</p>
            </div>
          </div>

          {success && !success.token ? (
            <div className="space-y-6">
              <div className="p-4 bg-success-bg text-success-text rounded-xl text-sm font-medium text-center animate-pop">
                {success.message}
              </div>
              <Link to="/login" className="block">
                <Button fullWidth size="lg" className="h-12 rounded-xl text-sm">
                  {t('auth.backToSignInPlain')}
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 bg-error-bg text-error-text rounded-xl text-xs font-semibold text-center animate-pop">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-text-light uppercase tracking-[0.14em] ml-1">{t('auth.email')}</label>
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

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="h-12 rounded-xl text-sm"
              >
                {t('auth.send')}
              </Button>
            </form>
          )}

          <div className="pt-4 text-center">
            <Link to="/login" className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-[0.14em]">
              {t('auth.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
