import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button, Input } from '../components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { login, isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/devices" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login({ email, password })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg && (msg.includes('500') || msg.includes('Authentication service') || msg.includes('error')) ? msg : 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="font-sans antialiased text-text-dark bg-background-light min-h-screen flex flex-col">

      {/* Mobile View (block md:hidden) */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4">
          <span className="material-symbols-outlined text-2xl cursor-pointer text-text-muted">close</span>
          <h1 className="text-lg font-bold text-text-dark">Sign In</h1>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        {/* Hero */}
        <div className="px-6 pt-8 pb-10">
          <h2 className="text-[32px] font-bold leading-tight mb-3 text-text-dark">Welcome to Secure Portal</h2>
          <p className="text-text-muted text-lg">Manage your access control devices and security settings</p>
        </div>

        {/* Form */}
        <form className="px-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-bg text-error-text p-4 rounded-xl text-sm font-bold border border-error-text/10">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-base font-semibold text-text-dark">Email Address</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-base font-semibold text-text-dark">Password</label>
              <a href="#" className="text-primary font-semibold">Forgot?</a>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-2 text-sm pr-10"
                required
              />
              <span
                className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-6 h-6 rounded border-border-base text-primary focus:ring-primary" id="mfa-mobile" />
            <span className="text-text-muted font-medium">Use Multi-Factor Authentication (MFA)</span>
          </label>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="rounded-xl gap-2 shadow-lg shadow-primary/20"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            <span className="material-symbols-outlined text-lg">login</span>
          </Button>
        </form>

        {/* Divider */}
        <div className="px-6 py-10 flex items-center gap-4">
          <div className="h-px bg-border-light flex-1"></div>
          <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">OR CONTINUE WITH</span>
          <div className="h-px bg-border-light flex-1"></div>
        </div>

        {/* Secondary Login */}
        <div className="px-6 grid grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center justify-center gap-2 rounded-xl font-bold bg-white/50">
            <span className="material-symbols-outlined text-[16px]">fingerprint</span>
            Biometrics
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-2 rounded-xl font-bold bg-white/50">
            <span className="material-symbols-outlined text-[16px]">key</span>
            SSO
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-auto px-6 py-8 text-center space-y-6">
          <p className="text-text-muted text-sm leading-relaxed px-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="font-bold text-[10px] text-primary tracking-widest uppercase pb-4">
            POWERED BY UNIFI ARCHITECTURE
          </div>
        </footer>
      </div>

      {/* Desktop View (hidden md:flex) */}
      <div className="hidden md:flex flex-col min-h-screen dot-background items-center justify-center p-6 bg-background-light">
        <div className="w-full max-w-[440px] bg-surface rounded-[24px] shadow-2xl p-10 space-y-8 border border-border-base">
          {/* Icon and Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-dark">Sign In</h2>
              <p className="text-text-muted mt-1">Access Control Platform</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-bg text-error-text p-4 rounded-lg text-sm font-bold border border-error-text/10">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-text-dark tracking-widest uppercase">EMAIL ADDRESS</label>
              <Input
                type="email"
                placeholder="user@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-75 border-transparent focus:bg-white text-[15px]"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-extrabold text-text-dark tracking-widest uppercase">PASSWORD</label>
                <a href="#" className="text-primary text-[11px] font-bold">Forgot?</a>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-75 border-transparent focus:bg-white text-[15px] pr-10"
                  required
                />
                <span
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer text-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-5 h-5 rounded border-border-base text-primary focus:ring-primary" id="mfa-desktop" />
              <span className="text-text-muted text-[13px] font-medium group-hover:text-text-dark transition-colors">Remember this device</span>
            </label>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              className="rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <span className="material-symbols-outlined text-lg">east</span>
            </Button>
          </form>

          <div className="pt-6 border-t border-border-light flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-text-muted font-bold text-[11px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">shield</span>
              Setup Multi-Factor Authentication (MFA)
            </div>
            <p className="text-[11px] text-text-muted tracking-tight font-medium">Protected by Enterprise Identity Services</p>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-8 flex gap-8 text-[11px] font-bold text-text-muted uppercase tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Help Center</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>

    </div>
  )
}
