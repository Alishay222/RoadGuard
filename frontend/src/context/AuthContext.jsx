import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)          // { email, name }
  const [token, setToken] = useState(() => localStorage.getItem('rg_token'))
  const [loading, setLoading] = useState(true)     // true while validating stored token

  // Validate a stored token against /api/auth/me on mount
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setUser({ email: data.email, name: data.name || '' })
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('rg_token')
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [token])

  const _storeSession = useCallback((data) => {
    localStorage.setItem('rg_token', data.access_token)
    setToken(data.access_token)
    setUser({ email: data.email, name: data.name || '' })
  }, [])

  const register = useCallback(async (email, password, name = '') => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Registration failed')
      _storeSession(data)
      return data
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timed out. Please check your connection and try again.')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }, [_storeSession])

  const login = useCallback(async (email, password) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      _storeSession(data)
      return data
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timed out. Please check your connection and try again.')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }, [_storeSession])

  const logout = useCallback(() => {
    localStorage.removeItem('rg_token')
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    isLoggedIn: Boolean(user),
    loading,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
