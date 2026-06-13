import { Outlet, useNavigate } from 'react-router-dom'
import AuthModal from '../../components/AuthModal'
import { useAuth } from '../../context/AuthContext'
import { AdminProvider } from '../context/AdminContext'

export default function AdminRouteGuard() {
  const navigate = useNavigate()
  const { loading, isLoggedIn, isAdmin, logout } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
        Checking admin access...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <AuthModal
        onClose={() => {}}
        reason="Sign in or create an account with admin privileges to access the admin panel."
        disableClose
      />
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            background: '#fff',
            color: '#0f172a',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '10px' }}>Admin access required</h2>
          <p style={{ marginTop: 0, marginBottom: '18px', color: '#475569' }}>
            Your account is authenticated but does not have admin privileges.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/app', { replace: true })}
              style={{
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              Go to App
            </button>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                background: '#0ea5e9',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <AdminProvider><Outlet /></AdminProvider>
}
