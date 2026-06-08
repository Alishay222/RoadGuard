import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)          // { email, name, is_admin }
  const [token, setToken] = useState(() => localStorage.getItem('rg_token'))
  const [loading, setLoading] = useState(true)     // true while validating stored token

  const toUser = useCallback((data = {}) => ({
    email: data.email || '',
    name: data.name || '',
    is_admin: Boolean(data.is_admin),
  }), [])

  const fetchCurrentUser = useCallback(async (sessionToken) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })

    if (!res.ok) {
      throw new Error('Invalid session')
    }

    return res.json()
  }, [])

  // Validate a stored token against /api/auth/me on mount
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetchCurrentUser(token)
      .then((data) => {
        if (!cancelled) setUser(toUser(data))
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
  }, [fetchCurrentUser, toUser, token])

  const _storeSession = useCallback((data) => {
    localStorage.setItem('rg_token', data.access_token)
    setToken(data.access_token)

    // Optimistically set user from auth response and then hydrate full profile.
    setUser(toUser(data))
    fetchCurrentUser(data.access_token)
      .then((profile) => setUser(toUser(profile)))
      .catch(() => {
        localStorage.removeItem('rg_token')
        setToken(null)
        setUser(null)
      })
  }, [fetchCurrentUser, toUser])

  const register = useCallback(async (formData) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      // If formData is a string (old API), handle it
      let payload = formData
      if (typeof formData === 'string') {
        payload = { email: formData, password: arguments[1], name: arguments[2] || '' }
      }
      
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    isAdmin: Boolean(user?.is_admin),
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
