import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

export default function AuthModal({ onClose, reason }) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        setSuccessMsg('Signed in successfully! 👋')
      } else {
        await register(email, password, name)
        setSuccessMsg('Registered successfully! 🎉')
      }
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" role="dialog" aria-label="Sign in to RoadGuard" aria-modal="true">
      <div className="auth-modal-backdrop" onClick={successMsg ? undefined : onClose} />
      <div className="auth-modal">

        {successMsg ? (
          /* ── Success screen ─────────────────────────────────────────── */
          <div className="auth-modal__success-screen">
            <div className="auth-modal__success-circle">
              <svg viewBox="0 0 52 52" className="auth-modal__success-svg" aria-hidden="true">
                <circle className="auth-modal__success-ring" cx="26" cy="26" r="24" fill="none" />
                <path className="auth-modal__success-tick" fill="none" d="M14 27 l9 9 l16-16" />
              </svg>
            </div>
            <h2 className="auth-modal__success-title">{successMsg}</h2>
            <p className="auth-modal__success-sub">
              {tab === 'login' ? 'Welcome back to RoadGuard.' : 'Your account is ready.'}
            </p>
          </div>
        ) : (
          /* ── Auth form ──────────────────────────────────────────────── */
          <>
            <button className="auth-modal__close" aria-label="Close" onClick={onClose}>×</button>

            {reason && <p className="auth-modal__reason">{reason}</p>}

            <div className="auth-modal__logo">
              <img src="/RoadGuardLogo.png" alt="RoadGuard" className="auth-modal__logo-img" />
            </div>

            <div className="auth-modal__tabs">
              <button
                type="button"
                className={`auth-modal__tab ${tab === 'login' ? 'auth-modal__tab--active' : ''}`}
                onClick={() => { setTab('login'); setError('') }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-modal__tab ${tab === 'signup' ? 'auth-modal__tab--active' : ''}`}
                onClick={() => { setTab('signup'); setError('') }}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
              {tab === 'signup' && (
                <div className="auth-modal__field">
                  <label htmlFor="auth-name" className="auth-modal__label">Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    className="auth-modal__input"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="auth-modal__field">
                <label htmlFor="auth-email" className="auth-modal__label">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-modal__input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="auth-modal__field">
                <label htmlFor="auth-password" className="auth-modal__label">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  className="auth-modal__input"
                  placeholder={tab === 'signup' ? 'Minimum 6 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={tab === 'signup' ? 6 : undefined}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && <p className="auth-modal__error">{error}</p>}

              <button type="submit" className="auth-modal__submit" disabled={loading}>
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="auth-modal__switch">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                className="auth-modal__switch-btn"
                onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError('') }}
              >
                {tab === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  )
}
