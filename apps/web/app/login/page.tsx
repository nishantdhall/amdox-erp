'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('nishant@amdox.com')
  const [password, setPassword] = useState('password123')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Demo mode — store token and redirect
    setTimeout(() => {
      localStorage.setItem('amdox_token', 'demo-token-2026')
      localStorage.setItem('amdox_user', JSON.stringify({ name: 'Nishant Dhall', email, role: 'TenantAdmin' }))
      router.push('/dashboard')
    }, 800)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-1 bg-[#1a1d2e] relative overflow-hidden items-center justify-center flex-col gap-6 px-10">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#4f6ef7]/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#764ba2]/15 rounded-full blur-[120px] animate-float delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#22a06b]/10 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-extrabold gradient-text tracking-tight">
            AMDOX ERP
          </h1>
          <p className="text-white/40 text-sm mt-3 max-w-[300px] mx-auto leading-relaxed">
            AI-powered enterprise resource planning for modern businesses
          </p>

          {/* Module cards */}
          <div className="grid grid-cols-2 gap-3 mt-8 w-[240px] mx-auto">
            <div className="bg-[#4f6ef7]/20 rounded-xl p-4 text-center animate-float">
              <div className="text-xl mb-1">💰</div>
              <div className="text-[11px] text-[#879fff] font-medium">Finance</div>
            </div>
            <div className="bg-[#22a06b]/20 rounded-xl p-4 text-center animate-float delay-200">
              <div className="text-xl mb-1">👥</div>
              <div className="text-[11px] text-[#5fdb9f] font-medium">HR</div>
            </div>
            <div className="bg-[#f59e0b]/20 rounded-xl p-4 text-center animate-float delay-300">
              <div className="text-xl mb-1">📦</div>
              <div className="text-[11px] text-[#fbbf24] font-medium">Supply</div>
            </div>
            <div className="bg-[#ef4444]/20 rounded-xl p-4 text-center animate-float delay-400">
              <div className="text-xl mb-1">🤖</div>
              <div className="text-[11px] text-[#f87171] font-medium">AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[440px] flex items-center justify-center p-8 lg:p-12 bg-white animate-slide-right">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold gradient-text">AMDOX ERP</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#1a1d2e]">Welcome back 👋</h2>
            <p className="text-sm text-[#8898aa] mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e0e5ef] rounded-lg text-sm text-[#1a1d2e] placeholder-[#aaa] focus:outline-none focus:border-[#4f6ef7] focus:ring-2 focus:ring-[#4f6ef7]/10 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#555] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#e0e5ef] rounded-lg text-sm text-[#1a1d2e] placeholder-[#aaa] focus:outline-none focus:border-[#4f6ef7] focus:ring-2 focus:ring-[#4f6ef7]/10 transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] text-[#666] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-[#e0e5ef] text-[#4f6ef7] focus:ring-[#4f6ef7]" />
                Remember me
              </label>
              <span className="text-[12px] text-[#4f6ef7] cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4f6ef7] to-[#764ba2] text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-60 transition-all text-sm shadow-lg shadow-[#4f6ef7]/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#e0e5ef]" />
              <span className="text-[10px] text-[#aaa] whitespace-nowrap">or continue with SSO</span>
              <div className="flex-1 h-px bg-[#e0e5ef]" />
            </div>

            {/* SSO */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-lg border border-[#e0e5ef] text-[12px] text-[#4f6ef7] font-medium hover:bg-[#4f6ef7]/5 transition-colors"
              >
                🔵 Google
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-lg border border-[#e0e5ef] text-[12px] text-[#4f6ef7] font-medium hover:bg-[#4f6ef7]/5 transition-colors"
              >
                🟦 Azure AD
              </button>
            </div>

            <div className="text-[9px] text-[#aaa] text-center mt-4 tracking-wide">
              🔒 MFA Protected &nbsp;•&nbsp; SOC 2 Type II &nbsp;•&nbsp; GDPR Compliant
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
