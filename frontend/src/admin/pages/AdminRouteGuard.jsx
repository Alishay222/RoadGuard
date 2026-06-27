import { Outlet, useNavigate } from 'react-router-dom'
import AuthModal from '../../components/AuthModal'
import { useAuth } from '../../context/AuthContext'
import { AdminProvider } from '../context/AdminContext'

export default function AdminRouteGuard() {
  const navigate = useNavigate()
  const { loading, isLoggedIn, isAdmin, logout } = useAuth()

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: '#060b18', position: 'relative', overflow: 'hidden',
      }}>
        {/* mesh */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 50% at 20% 10%,  rgba(59,130,246,0.18) 0%,transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 20%,  rgba(139,92,246,0.15) 0%,transparent 55%),
            radial-gradient(ellipse 50% 60% at 50% 90%,  rgba(6,182,212,0.10)  0%,transparent 55%)
          `,
        }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {/* spinner ring */}
          <div style={{
            width: 52, height: 52,
            border: '3px solid rgba(99,102,241,.15)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'guardSpin .75s linear infinite',
          }} />
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 500,
            background: 'linear-gradient(100deg,#e2e8f0,#a78bfa,#60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Checking admin access…</p>
        </div>
        <style>{`@keyframes guardSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  /* ── not logged in — let AuthModal handle it ── */
  if (!isLoggedIn) {
    return (
      <AuthModal
        onClose={() => {}}
        reason="Sign in or create an account with admin privileges to access the admin panel."
        disableClose
      />
    )
  }

  /* ── logged in but not admin ── */
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: '#060b18', position: 'relative', overflow: 'hidden', padding: 24,
      }}>
        {/* mesh bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 50% at 20% 0%,  rgba(59,130,246,0.15) 0%,transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(139,92,246,0.13) 0%,transparent 55%),
            radial-gradient(ellipse 50% 60% at 10% 80%, rgba(239,68,68,0.08)  0%,transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 90%, rgba(6,182,212,0.09)  0%,transparent 55%)
          `,
          animation: 'guardMesh 12s ease-in-out infinite alternate',
        }} />

        {/* card */}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 440, width: '100%',
          borderRadius: 20, padding: '1.5px',
          background: 'linear-gradient(135deg,#1e3a8a,#7c3aed,#dc2626)',
          animation: 'guardCardIn .45s cubic-bezier(.22,1,.36,1) both',
          boxShadow: '0 32px 80px rgba(0,0,0,.7)',
        }}>
          <div style={{
            background: 'linear-gradient(145deg,#0d1526,#0a1020)',
            borderRadius: 19, overflow: 'hidden',
          }}>
            {/* top gradient bar */}
            <div style={{
              height: 4,
              background: 'linear-gradient(90deg,#3b82f6,#7c3aed,#ec4899)',
            }} />

            <div style={{ padding: '36px 32px 32px', textAlign: 'center' }}>
              {/* icon */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg,rgba(220,38,38,.15),rgba(239,68,68,.25))',
                border: '1px solid rgba(239,68,68,.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 0 32px -8px rgba(239,68,68,.4)',
              }}>🔒</div>

              <h2 style={{
                margin: '0 0 10px', fontSize: 20, fontWeight: 800,
                background: 'linear-gradient(100deg,#f1f5f9,#fca5a5)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Admin access required</h2>

              <p style={{
                margin: '0 0 28px', fontSize: 14, color: '#64748b', lineHeight: 1.6,
              }}>
                Your account is authenticated but does not have admin privileges.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {/* Go to App */}
                <button
                  type="button"
                  onClick={() => navigate('/app', { replace: true })}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                    background: 'linear-gradient(135deg,#1e293b,#334155)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'transform .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
                >
                  <span style={{ position:'relative', zIndex:1 }}>← Go to App</span>
                </button>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={() => logout()}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#fff',
                    background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
                    border: 'none',
                    transition: 'transform .15s, box-shadow .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(59,130,246,.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
                >
                  <span style={{ position:'relative', zIndex:1 }}>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes guardMesh {
            0%   { opacity:1;   filter:hue-rotate(0deg);   }
            50%  { opacity:0.8; filter:hue-rotate(15deg);  }
            100% { opacity:1;   filter:hue-rotate(-10deg); }
          }
          @keyframes guardCardIn {
            from { opacity:0; transform:translateY(24px) scale(.97); }
            to   { opacity:1; transform:none; }
          }
          @keyframes guardSpin { to { transform:rotate(360deg); } }
          @media(prefers-reduced-motion:reduce){
            *{animation:none!important;transition:none!important;}
          }
        `}</style>
      </div>
    )
  }

  return <AdminProvider><Outlet /></AdminProvider>
}