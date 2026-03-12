import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLoading } from '../context/LoadingContext'
import { Button, Input } from '../components/atoms'
import { Modal } from '../components/organisms'
import { apiRequest, consumeSessionExpiredFlag } from '../lib/api'

interface SetupRequiredResponse {
  required: boolean
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { startLoading, stopLoading, isLoading } = useLoading()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false)
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  const { login, isAuthenticated } = useAuth()

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
      setError(msg && (msg.includes('500') || msg.includes('Authentication service') || msg.includes('error')) ? msg : 'Invalid email or password. Please try again.')
    } finally {
      stopLoading()
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light font-sans antialiased text-text-dark">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <Modal isOpen={showSessionExpiredDialog} onClose={() => setShowSessionExpiredDialog(false)} title="Security Update">
        <div className="space-y-6 py-2 text-center">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-3xl">timer_off</span>
          </div>
          <p className="text-sm font-medium text-text-dark leading-relaxed">
            Your session has expired. Please log in again.
          </p>
          <Button fullWidth onClick={() => setShowSessionExpiredDialog(false)}>OK</Button>
        </div>
      </Modal>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden group border-none">

          {/* Branding */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-3xl">shield_lock</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-text-dark tracking-tight uppercase">Sign In</h1>
              <p className="text-text-light text-[10px] font-black uppercase tracking-widest">Access your UniFi dashboard</p>
            </div>
          </div>

          {/* Access Form */}
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
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">alternate_email</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest transition-colors">Forgot?</a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-none shadow-sm text-text-dark text-sm py-3 px-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold"
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
              className="rounded-2xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Sign In
            </Button>
          </form>

          {/* Footer Branding */}
          <div className="pt-4 text-center">
            <p className="text-text-light/50 text-[9px] font-black uppercase tracking-[0.4em]">Powered by Unifi Architecture</p>
          </div>
        </div>
      </div>
    </div>
  )
}
