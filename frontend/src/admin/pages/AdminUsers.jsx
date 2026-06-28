import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

/* ── avatar initials ── */
function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = [...(name || 'U')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue},70%,35%), hsl(${(hue + 60) % 360},80%,55%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff', letterSpacing: '.5px',
      boxShadow: `0 0 0 2px rgba(255,255,255,0.08)`
    }}>{initials}</div>
  )
}

/* ── status / role badge ── */
function Badge({ type }) {
  const map = {
    active:      { label: 'Active',       bg: 'linear-gradient(135deg,#064e3b,#10b981)', color: '#6ee7b7', border: 'rgba(52,211,153,.3)' },
    inactive:    { label: 'Inactive',     bg: 'linear-gradient(135deg,#450a0a,#dc2626)', color: '#fca5a5', border: 'rgba(239,68,68,.3)'   },
    admin:       { label: 'Admin',        bg: 'linear-gradient(135deg,#3b0764,#7c3aed)', color: '#c4b5fd', border: 'rgba(167,139,250,.3)' },
    user:        { label: 'User',         bg: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#94a3b8', border: 'rgba(148,163,184,.2)' },
  }
  const s = map[type] || map.user
  return (
    <span style={{
      position: 'relative', overflow: 'hidden', display: 'inline-flex',
      alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '.4px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: s.color, opacity: .85, flexShrink: 0
      }} />
      {s.label}
    </span>
  )
}

/* ── action button ── */
function Btn({ children, grad, color = '#fff', onClick, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: small ? '4px 10px' : '6px 14px',
        borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11, fontWeight: 600, color,
        background: grad, opacity: disabled ? .5 : 1,
        transition: 'transform .15s ease, box-shadow .15s ease, opacity .15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.4)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <span style={{
        position: 'absolute', top: 0, left: '-120%', width: '60%', height: '100%',
        background: 'linear-gradient(105deg,transparent,rgba(255,255,255,.18),transparent)',
        animation: 'btnShimmer 2.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}

/* ── dark glass modal ── */
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%', maxWidth,
          background: 'linear-gradient(145deg,#0d1526,#0a1020)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(139,92,246,.2)',
          animation: 'slideUp .25s cubic-bezier(.22,1,.36,1)',
          overflow: 'hidden',
        }}
      >
        {/* modal gradient header bar */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(90deg,rgba(59,130,246,.12),rgba(139,92,246,.12))',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{
            margin: 0, fontSize: 16, fontWeight: 700,
            background: 'linear-gradient(100deg,#e2e8f0,#a78bfa,#60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
              cursor: 'pointer', fontSize: 16, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

/* ── detail field ── */
function Field({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: '12px 14px',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{value || 'N/A'}</p>
    </div>
  )
}

export default function AdminUsers() {
  const { token, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (authLoading || !token) return
    fetchUsers()
  }, [authLoading, token])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=5000`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser   = (user) => { setSelectedUser(user); setShowDetails(true) }
  const handleDeleteUser = (user) => setConfirmDialog({ type: 'delete', user, title: 'Delete User', message: `Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.` })
  const handleToggleStatus = (user) => {
    const newStatus = !user.is_active
    setConfirmDialog({ type: 'status', user, newStatus, title: newStatus ? 'Activate User' : 'Deactivate User', message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.name || user.email}?` })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return
    setActionLoading(confirmDialog.user._id)
    try {
      if (confirmDialog.type === 'delete') {
        const r = await fetch(`${API_BASE_URL}/api/admin/users/${confirmDialog.user._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) { setUsers(u => u.filter(x => x._id !== confirmDialog.user._id)); alert('User deleted successfully') }
        else { const d = await r.json(); alert(`Error: ${d.detail || 'Failed to delete user'}`) }
      } else if (confirmDialog.type === 'status') {
        const r = await fetch(`${API_BASE_URL}/api/admin/users/${confirmDialog.user._id}/status?active=${confirmDialog.newStatus}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) { setUsers(u => u.map(x => x._id === confirmDialog.user._id ? { ...x, is_active: confirmDialog.newStatus } : x)); alert(`User ${confirmDialog.newStatus ? 'activated' : 'deactivated'} successfully`) }
        else { const d = await r.json(); alert(`Error: ${d.detail || 'Failed to update status'}`) }
      }
      setConfirmDialog(null)
    } catch { alert('An error occurred. Please try again.') }
    finally { setActionLoading(null) }
  }

  const filtered = users.filter(u =>
    !search ||
    (u.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.city  || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="users" />

      <div className="admin-main usr-main-wrap">
        <AdminHeader title="User Management" />
        <div className="admin-content" style={{ padding: 0 }}>
          <div style={{ padding: '28px 32px 56px', position: 'relative', zIndex: 1 }}>

            {/* ── page heading ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 className="usr-heading-grad">User Management</h2>
                <span className="usr-count-badge">{users.length} users</span>
              </div>

              {/* search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#475569', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users…"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '8px 14px 8px 34px',
                    fontSize: 13, color: '#e2e8f0', outline: 'none',
                    width: 220, transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,.12)' }}
                  onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* ── table card ── */}
            <div className="usr-table-card">
              <div className="usr-table-card__inner">
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16, color: '#475569' }}>
                    <div className="usr-spinner" />
                    <p style={{ margin: 0, fontSize: 14 }}>Loading users…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: 14 }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                      <thead>
                        <tr>
                          {['User', 'Email', 'Phone', 'City', 'Status', 'Role', 'Joined', 'Actions'].map(h => (
                            <th key={h} style={{
                              padding: '12px 14px', textAlign: 'left',
                              fontSize: 11, fontWeight: 600, letterSpacing: '.6px',
                              color: '#64748b', textTransform: 'uppercase',
                              borderBottom: '1px solid rgba(255,255,255,0.07)',
                              whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((user, idx) => (
                          <tr
                            key={user._id}
                            className="usr-row"
                            style={{
                              opacity: user.is_active === false ? 0.55 : 1,
                              animationDelay: `${Math.min(idx, 15) * 30}ms`,
                            }}
                          >
                            {/* user cell */}
                            <td style={{ padding: '13px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={user.name} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                  {user.name || '—'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '13px 14px', fontSize: 13, color: '#94a3b8', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</td>
                            <td style={{ padding: '13px 14px', fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{user.phone || '—'}</td>
                            <td style={{ padding: '13px 14px', fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{user.city || '—'}</td>
                            <td style={{ padding: '13px 14px' }}>
                              <Badge type={user.is_active === false ? 'inactive' : 'active'} />
                            </td>
                            <td style={{ padding: '13px 14px' }}>
                              <Badge type={user.is_admin ? 'admin' : 'user'} />
                            </td>
                            <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '13px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                <Btn
                                  grad="linear-gradient(135deg,#1e3a8a,#3b82f6)"
                                  onClick={() => handleViewUser(user)}
                                  disabled={actionLoading === user._id}
                                  small
                                >View</Btn>
                                <Btn
                                  grad={user.is_active === false
                                    ? 'linear-gradient(135deg,#064e3b,#10b981)'
                                    : 'linear-gradient(135deg,#78350f,#d97706)'}
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={actionLoading === user._id}
                                  small
                                >{user.is_active === false ? 'Activate' : 'Deactivate'}</Btn>
                                <Btn
                                  grad="linear-gradient(135deg,#7f1d1d,#dc2626)"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={actionLoading === user._id}
                                  small
                                >{actionLoading === user._id ? '…' : 'Delete'}</Btn>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── user details modal ── */}
      {showDetails && selectedUser && (
        <Modal title="User Details" onClose={() => setShowDetails(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Avatar name={selectedUser.name} size={52} />
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>{selectedUser.name}</p>
              <p style={{ margin: '2px 0 6px', fontSize: 13, color: '#64748b' }}>{selectedUser.email}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge type={selectedUser.is_active === false ? 'inactive' : 'active'} />
                <Badge type={selectedUser.is_admin ? 'admin' : 'user'} />
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Phone"             value={selectedUser.phone} />
            <Field label="City"              value={selectedUser.city} />
            <Field label="Language"          value={selectedUser.language_preference} />
            <Field label="Vehicle Type"      value={selectedUser.vehicle_type} />
            <Field label="License Plate"     value={selectedUser.license_plate} />
            <Field label="Experience"        value={selectedUser.driving_experience} />
            <Field label="Emergency Contact" value={selectedUser.emergency_contact_name} />
            <Field label="Emergency Phone"   value={selectedUser.emergency_contact_phone} />
            <Field label="Joined"            value={new Date(selectedUser.created_at).toLocaleDateString()} />
          </div>
        </Modal>
      )}

      {/* ── confirm dialog ── */}
      {confirmDialog && (
        <Modal title={confirmDialog.title} onClose={() => setConfirmDialog(null)} maxWidth={400}>
          <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
            {confirmDialog.message}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn
              grad="linear-gradient(135deg,#1e293b,#334155)"
              onClick={() => setConfirmDialog(null)}
            >Cancel</Btn>
            <Btn
              grad={confirmDialog.type === 'delete'
                ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'
                : 'linear-gradient(135deg,#78350f,#d97706)'}
              onClick={confirmAction}
              disabled={!!actionLoading}
            >{actionLoading ? 'Processing…' : confirmDialog.type === 'delete' ? 'Delete' : 'Confirm'}</Btn>
          </div>
        </Modal>
      )}

      <style>{`
        /* ── page bg — same mesh as dashboard ── */
        .usr-main-wrap {
          position: relative; min-height: 100vh;
          background: #060b18; overflow: hidden;
        }
        .usr-main-wrap::before {
          content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%,  rgba(59,130,246,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(139,92,246,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 10% 80%, rgba(16,185,129,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 90%, rgba(6,182,212,0.10)  0%, transparent 55%);
          animation: meshShiftU 12s ease-in-out infinite alternate;
        }
        @keyframes meshShiftU {
          0%   { opacity:1;   filter:hue-rotate(0deg);   }
          50%  { opacity:0.8; filter:hue-rotate(15deg);  }
          100% { opacity:1;   filter:hue-rotate(-10deg); }
        }

        /* ── heading ── */
        .usr-heading-grad {
          margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.3px;
          background: linear-gradient(100deg,#e2e8f0 0%,#a78bfa 50%,#60a5fa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .usr-count-badge {
          background: linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.15));
          color: #a78bfa; font-size: 11px; font-weight: 600; letter-spacing: .4px;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid rgba(167,139,250,.25);
        }

        /* ── table card with gradient border ── */
        .usr-table-card {
          border-radius: 18px; padding: 1.5px;
          background: linear-gradient(135deg,#1e3a8a,#6366f1,#7c3aed);
          transition: box-shadow .25s ease;
        }
        .usr-table-card:hover {
          box-shadow: 0 0 48px -10px rgba(99,102,241,.5), 0 16px 48px rgba(0,0,0,.5);
        }
        .usr-table-card__inner {
          background: linear-gradient(145deg,#0d1526,#0a1020);
          border-radius: 17px; overflow: hidden;
        }

        /* ── table rows ── */
        .usr-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background .18s ease;
          animation: rowIn .35s cubic-bezier(.22,1,.36,1) both;
        }
        .usr-row:last-child { border-bottom: none; }
        .usr-row:hover { background: rgba(99,102,241,0.07); }
        .usr-row:hover td:first-child { 
          background: rgba(99,102,241,0.05);
        }
        @keyframes rowIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0);    }
        }

        /* ── button shimmer ── */
        @keyframes btnShimmer {
          0%        { left:-120%; }
          55%,100%  { left:160%;  }
        }

        /* ── spinner ── */
        .usr-spinner {
          width:40px; height:40px;
          border:3px solid rgba(99,102,241,.15);
          border-top-color:#6366f1; border-radius:50%;
          animation:spinU .75s linear infinite;
        }
        @keyframes spinU { to { transform:rotate(360deg); } }

        /* ── modals ── */
        @keyframes fadeIn  { from{opacity:0}        to{opacity:1}         }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }

        /* ── responsive ── */
        @media (max-width:768px) {
          .usr-main-wrap .admin-content > div { padding:16px 14px 40px !important; }
        }
        @media (prefers-reduced-motion:reduce) {
          .usr-main-wrap::before, .usr-row { animation:none; transition:none; }
        }
      `}</style>
    </div>
  )
}