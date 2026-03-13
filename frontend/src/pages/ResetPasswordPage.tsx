import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLoading } from '../context/LoadingContext'
import { Button, Input } from '../components/atoms'
import { apiRequest } from '../lib/api'

export function ResetPasswordPage() {
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
      setError('Введите email.')
      return
    }
    if (!token?.trim()) {
      setError('Введите токен восстановления.')
      return
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают.')
      return
    }
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов.')
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
      setError(msg || 'Ошибка при сбросе пароля.')
    } finally {
      stopLoading()
    }
  }

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light font-sans antialiased text-text-dark">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-surface rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden group border-none">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-text-dark tracking-tight uppercase">Пароль изменён</h1>
                <p className="text-text-light text-[10px] font-black uppercase tracking-widest">Теперь вы можете войти с новым паролем</p>
              </div>
            </div>
            <Link to="/login" className="block">
              <Button fullWidth size="lg" className="rounded-2xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light font-sans antialiased text-text-dark">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden group border-none">

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-3xl">key</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-text-dark tracking-tight uppercase">Новый пароль</h1>
              <p className="text-text-light text-[10px] font-black uppercase tracking-widest">Введите токен и новый пароль</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-error-bg text-error-text rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Email</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Токен восстановления</label>
                <Input
                  type="text"
                  placeholder="Вставьте токен из письма"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold w-full font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Новый пароль</label>
                <Input
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold w-full"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Подтвердите пароль</label>
                <Input
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-4 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold w-full"
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
              className="rounded-2xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Сбросить пароль
            </Button>
          </form>

          <div className="pt-4 text-center">
            <Link to="/forgot-password" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
              Запросить новый токен
            </Link>
            <span className="text-text-light/50 mx-2">|</span>
            <Link to="/login" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
