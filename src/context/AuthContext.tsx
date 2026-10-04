import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '../services/api'

export interface AuthUser {
  id: string
  email: string
  role: 'Admin' | 'Researcher'
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cardiovision_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function validateSession() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Session expired')

        const data = await response.json()
        if (!cancelled) {
          setUser({ id: data.id, email: data.email, role: data.role })
        }
      } catch {
        localStorage.removeItem('cardiovision_token')
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    validateSession()
    return () => { cancelled = true }
  }, [token])

  async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed. Check your email and password.')
    }

    localStorage.setItem('cardiovision_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  async function logout() {
    const currentToken = localStorage.getItem('cardiovision_token')

    try {
      if (currentToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        })
      }
    } finally {
      localStorage.removeItem('cardiovision_token')
      setToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
