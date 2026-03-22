import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLoading } from '../context/LoadingContext'
import { Button, Input } from '../components/atoms'
import { apiRequest } from '../lib/api'

interface ForgotPasswordResponse {
  message: string
  token?: string
}

export function ForgotPasswordPage() {
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
      setError('Enter your email.')
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
      setError(msg || 'Password reset request failed.')
    } finally {
      stopLoading()
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-background-light font-sans antialiased text-text-dark">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface rounded-[2.5rem] shadow-2xl p-8 sm:p-10 space-y-8 relative overflow-hidden group border-none">

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-text-dark tracking-tight uppercase">Reset password</h1>
              <p className="text-text-light text-[10px] font-black uppercase tracking-widest">Enter your email to receive a link</p>
            </div>
          </div>

          {success && !success.token ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 text-emerald-700 rounded-2xl text-sm font-medium text-center">
                {success.message}
              </div>
              <Link to="/login" className="block">
                <Button fullWidth size="lg" className="rounded-2xl font-black uppercase tracking-widest h-12">
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-error-bg text-error-text rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Email</label>
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

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                size="lg"
                className="rounded-2xl font-black uppercase tracking-widest h-12 shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Send
              </Button>
            </form>
          )}

          <div className="pt-4 text-center">
            <Link to="/login" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
