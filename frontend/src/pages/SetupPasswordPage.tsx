import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoading } from '../context/LoadingContext'
import { Button, Input } from '../components/atoms'
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
    if (!email?.trim()) {
      setError('Please enter an email.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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
      setError(msg || 'Failed to set password.')
    } finally {
      stopLoading()
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-light" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black text-text-light uppercase tracking-widest animate-pulse">Initializing Setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light font-sans antialiased text-text-dark">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden group border-none">

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-text-dark tracking-tight uppercase">Initial Setup</h1>
              <p className="text-text-light text-[10px] font-black uppercase tracking-widest leading-relaxed">Create your administrative account</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-error-bg text-error-text rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-none shadow-sm text-text-dark text-sm py-3 pl-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    required
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-xl">verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Master Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-none shadow-sm text-text-dark text-sm py-3 px-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold"
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
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat master password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white border-none shadow-sm text-text-dark text-sm py-3 px-12 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-bold"
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
                className="rounded-2xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Complete Setup
              </Button>
            </div>
          </form>

          <div className="pt-4 text-center">
            <p className="text-text-light/50 text-[9px] font-black uppercase tracking-[0.4em]">Powered by Unifi Architecture</p>
          </div>
        </div>
      </div>
    </div>
  )
}
