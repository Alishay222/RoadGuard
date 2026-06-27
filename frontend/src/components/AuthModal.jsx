import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

export default function AuthModal({ onClose, reason, disableClose = false }) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    vehicle_type: '',
    license_plate: '',
    driving_experience: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(formData.email, formData.password)
        setSuccessMsg('Signed in successfully! 👋')
      } else {
        // For signup, pass the entire formData
        await register(formData)
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
            {!disableClose && (
              <button className="auth-modal__close" aria-label="Close" onClick={onClose}>×</button>
            )}

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
              {tab === 'signup' ? (
                <>
                  <div className="auth-modal__field">
                    <label htmlFor="auth-name" className="auth-modal__label">First Name *</label>
                    <input
                      id="auth-name"
                      type="text"
                      name="name"
                      className="auth-modal__input"
                      placeholder="Your first name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-city" className="auth-modal__label">Location *</label>
                    <select
                      id="auth-city"
                      name="city"
                      className="auth-modal__input"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Location</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Multan">Multan</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Quetta">Quetta</option>
                    </select>
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-phone" className="auth-modal__label">Phone Number *</label>
                    <input
                      id="auth-phone"
                      type="tel"
                      name="phone"
                      className="auth-modal__input"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      autoComplete="tel"
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-email" className="auth-modal__label">Email *</label>
                    <input
                      id="auth-email"
                      type="email"
                      name="email"
                      className="auth-modal__input"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-password" className="auth-modal__label">Password *</label>
                    <input
                      id="auth-password"
                      type="password"
                      name="password"
                      className="auth-modal__input"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-emergency-name" className="auth-modal__label">Emergency Contact Name *</label>
                    <input
                      id="auth-emergency-name"
                      type="text"
                      name="emergency_contact_name"
                      className="auth-modal__input"
                      placeholder="Contact person name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-emergency-phone" className="auth-modal__label">Emergency Contact Phone *</label>
                    <input
                      id="auth-emergency-phone"
                      type="tel"
                      name="emergency_contact_phone"
                      className="auth-modal__input"
                      placeholder="+92 300 1234567"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-vehicle" className="auth-modal__label">Vehicle Type *</label>
                    <select
                      id="auth-vehicle"
                      name="vehicle_type"
                      className="auth-modal__input"
                      value={formData.vehicle_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Bus">Bus</option>
                      <option value="Truck">Truck</option>
                      <option value="Taxi">Taxi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-plate" className="auth-modal__label">License Plate *</label>
                    <input
                      id="auth-plate"
                      type="text"
                      name="license_plate"
                      className="auth-modal__input"
                      placeholder="ABC-1234"
                      value={formData.license_plate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-experience" className="auth-modal__label">Driving Experience *</label>
                    <select
                      id="auth-experience"
                      name="driving_experience"
                      className="auth-modal__input"
                      value={formData.driving_experience}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Experience</option>
                      <option value="0-1 years">0-1 years</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-modal__field">
                    <label htmlFor="auth-email" className="auth-modal__label">Email</label>
                    <input
                      id="auth-email"
                      type="email"
                      name="email"
                      className="auth-modal__input"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="auth-modal__field">
                    <label htmlFor="auth-password" className="auth-modal__label">Password</label>
                    <input
                      id="auth-password"
                      type="password"
                      name="password"
                      className="auth-modal__input"
                      placeholder="Your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </>
              )}

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
