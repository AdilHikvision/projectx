import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoading } from '../context/LoadingContext'
import { Button, Input } from '../components/ui'
import { apiRequest } from '../lib/api'

interface SetupRequiredResponse {
  required: boolean
  email?: string
}

export function SetupPasswordPage() {
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
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов.')
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
      setError(msg || 'Не удалось задать пароль.')
    } finally {
      stopLoading()
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background-light" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Проверка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="font-sans antialiased text-text-dark bg-background-light min-h-screen flex flex-col">
      {/* Mobile View */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 py-4">
          <div className="w-6" />
          <h1 className="text-lg font-bold text-text-dark">Задание пароля</h1>
          <div className="w-6" />
        </header>

        <div className="px-6 pt-8 pb-10">
          <h2 className="text-[32px] font-bold leading-tight mb-3 text-text-dark">Первоначальная настройка</h2>
          <p className="text-text-muted text-lg">Задайте пароль для учётной записи администратора</p>
        </div>

        <form className="px-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-bg text-error-text p-4 rounded-xl text-sm font-bold border border-error-text/10">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-base font-semibold text-text-dark">Email</label>
            <Input
              type="email"
              placeholder="admin@projectx.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-semibold text-text-dark">Новый пароль</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-2 text-sm pr-10"
                required
                minLength={8}
              />
              <span
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-semibold text-text-dark">Подтвердите пароль</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="py-2 text-sm pr-10"
                required
                minLength={8}
              />
              <span
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="rounded-xl gap-2 shadow-lg shadow-primary/20"
          >
            {isLoading ? 'Сохранение...' : 'Задать пароль'}
            <span className="material-symbols-outlined text-lg">lock</span>
          </Button>
        </form>

        <footer className="mt-auto px-6 py-8 text-center">
          <div className="font-bold text-[10px] text-primary tracking-widest uppercase pb-4">
            POWERED BY UNIFI ARCHITECTURE
          </div>
        </footer>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-col min-h-screen dot-background items-center justify-center p-6 bg-background-light">
        <div className="w-full max-w-[440px] bg-surface rounded-[24px] shadow-2xl p-10 space-y-8 border border-border-base">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-dark">Задание пароля</h2>
              <p className="text-text-muted mt-1">Первоначальная настройка администратора</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-bg text-error-text p-4 rounded-lg text-sm font-bold border border-error-text/10">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-text-dark tracking-widest uppercase">EMAIL</label>
              <Input
                type="email"
                placeholder="admin@projectx.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-75 border-transparent focus:bg-white text-[15px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-text-dark tracking-widest uppercase">НОВЫЙ ПАРОЛЬ</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-75 border-transparent focus:bg-white text-[15px] pr-10"
                  required
                  minLength={8}
                />
                <span
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer text-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-text-dark tracking-widest uppercase">ПОДТВЕРДИТЕ ПАРОЛЬ</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-75 border-transparent focus:bg-white text-[15px] pr-10"
                  required
                  minLength={8}
                />
                <span
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer text-xl"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              className="rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {isLoading ? 'Сохранение...' : 'Задать пароль'}
              <span className="material-symbols-outlined text-lg">east</span>
            </Button>
          </form>
        </div>

        <div className="mt-8 flex gap-8 text-[11px] font-bold text-text-muted uppercase tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Help Center</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
