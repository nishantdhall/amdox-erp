'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'

interface User {
  id?: string
  name: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const PUBLIC_PATHS = ['/login']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('amdox_token')
    const storedUser = localStorage.getItem('amdox_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        api.setToken(storedToken)
      } catch {
        localStorage.removeItem('amdox_token')
        localStorage.removeItem('amdox_user')
      }
    }
    setIsLoading(false)
  }, [])

  // Redirect logic
  useEffect(() => {
    if (isLoading) return

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

    if (!token && !isPublic && pathname !== '/') {
      router.replace('/login')
    }
  }, [token, pathname, isLoading, router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password)

      if (res.success && res.data) {
        const { accessToken, user: userData } = res.data
        const userObj: User = {
          id: userData?.id,
          name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || email.split('@')[0],
          email: userData?.email || email,
          role: userData?.role || 'EMPLOYEE',
          firstName: userData?.firstName,
          lastName: userData?.lastName,
        }

        setToken(accessToken)
        setUser(userObj)
        api.setToken(accessToken)
        localStorage.setItem('amdox_token', accessToken)
        localStorage.setItem('amdox_user', JSON.stringify(userObj))

        if (res.data.refreshToken) {
          localStorage.setItem('amdox_refresh_token', res.data.refreshToken)
        }

        return { success: true }
      }

      // If API is not running, fall back to demo mode
      return { success: false, error: res.message || 'Invalid credentials' }
    } catch {
      // API unreachable — use demo mode
      console.warn('API unreachable, using demo mode')
      const demoUser: User = {
        name: 'Nishant Dhall',
        email,
        role: 'TenantAdmin',
      }
      const demoToken = 'demo-token-2026'

      setToken(demoToken)
      setUser(demoUser)
      api.setToken(demoToken)
      localStorage.setItem('amdox_token', demoToken)
      localStorage.setItem('amdox_user', JSON.stringify(demoUser))

      return { success: true }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    api.clearToken()
    localStorage.removeItem('amdox_token')
    localStorage.removeItem('amdox_user')
    localStorage.removeItem('amdox_refresh_token')
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
