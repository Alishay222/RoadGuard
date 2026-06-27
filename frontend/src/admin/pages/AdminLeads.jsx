import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

/* ── avatar initials ── */
function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = [...(name || 'U')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,hsl(${hue},65%,30%),hsl(${(hue+60)%360},75%,52%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#fff', letterSpacing: '.5px',
      boxShadow: '0 0 0 2px rgba(255,255,255,0.08)',
    }}>{initials}</div>
  )
}

/* ── message preview ── */
function MessagePreview({ text }) {
  if (!text) return <span style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>No message</span>
  const truncated = text.length > 80 ? text.slice(0, 80) + '…' : text
  return (
    <span style={{
      fontSize: 13, color: '#94a3b8', lineHeight: 1.5,
      display: '-webkit-box', WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical', overflow: 'hidden',
      maxWidth: 300,
    }}>{truncated}</span>
  )
}

export default function AdminLeads() {
  const { token, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (authLoading || !token) return
    fetchLeads()
  }, [authLoading, token])

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = leads.filter(l =>
    !search ||
    (l.name    || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email   || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.message || '').toLowerCase().includes(search.toLowerCase())
  )

  /* date range for the badge */
  const newest = leads.length ? new Date(Math.max(...leads.map(l => new Date(l.created_at)))) : null
  const newestLabel = newest ? newest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="leads" />

      <div className="admin-main ld-main-wrap">
        <AdminHeader title="Contact Form Submissions" />
        <div className="admin-content" style={{ padding: 0 }}>
          <div style={{ padding: '28px 32px 56px', position: 'relative', zIndex: 1 }}>

            {/* ── heading row ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 className="ld-heading-grad">Leads</h2>
                <span className="ld-count-badge">💬 {leads.length} submissions</span>
                {newestLabel && (
                  <span className="ld-new-badge">Latest: {newestLabel}</span>
                )}
              </div>
              {/* search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#475569', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search leads…"
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '8px 14px 8px 34px',
                    fontSize: 13, color: '#e2e8f0', outline: 'none', width: 220,
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(52,211,153,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(52,211,153,.1)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,.1)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* ── summary strip ── */}
            {!loading && leads.length > 0 && (
              <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Leads',   value: leads.length,   grad: 'linear-gradient(135deg,#0f4c81,#3b82f6)', color: '#93c5fd', icon: '📋' },
                  { label: 'This Month', value: leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length, grad: 'linear-gradient(135deg,#064e3b,#10b981)', color: '#6ee7b7', icon: '📅' },
                  { label: 'With Message', value: leads.filter(l => l.message?.trim()).length, grad: 'linear-gradient(135deg,#3b0764,#7c3aed)', color: '#c4b5fd', icon: '💬' },
                ].map(({ label, value, grad, color, icon }, i) => (
                  <div key={label} className="ld-mini-card" style={{ '--mg': grad, '--mc': color, animationDelay: `${i * 80}ms` }}>
                    <div className="ld-mini-card__shimmer" />
                    <span style={{ fontSize: 20, position: 'relative', zIndex: 2 }}>{icon}</span>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── table card ── */}
            <div className="ld-table-card">
              <div className="ld-table-card__inner">
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16, color: '#475569' }}>
                    <div className="ld-spinner" />
                    <p style={{ margin: 0, fontSize: 14 }}>Loading submissions…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: 14 }}>
                    {search ? 'No leads match your search.' : 'No submissions yet.'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead>
                        <tr>
                          {['#', 'Name', 'Email', 'Message', 'Date'].map(h => (
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
                        {filtered.map((lead, idx) => (
                          <tr
                            key={lead._id}
                            className="ld-row"
                            style={{ animationDelay: `${Math.min(idx, 20) * 25}ms`, cursor: 'pointer' }}
                            onClick={() => setSelected(lead)}
                          >
                            {/* # */}
                            <td style={{ padding: '13px 14px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 24, height: 24, borderRadius: 6,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: 11, fontWeight: 600, color: '#475569',
                              }}>{idx + 1}</span>
                            </td>
                            {/* name */}
                            <td style={{ padding: '13px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={lead.name} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                  {lead.name || '—'}
                                </span>
                              </div>
                            </td>
                            {/* email */}
                            <td style={{ padding: '13px 14px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 12, color: '#94a3b8',
                              }}>
                                <span style={{ fontSize: 11 }}>✉️</span>
                                <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {lead.email || '—'}
                                </span>
                              </span>
                            </td>
                            {/* message */}
                            <td style={{ padding: '13px 14px', maxWidth: 300 }}>
                              <MessagePreview text={lead.message} />
                            </td>
                            {/* date */}
                            <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(lead.created_at).toLocaleDateString()}
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

      {/* ── lead detail modal ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeInL .2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '90%', maxWidth: 480,
              background: 'linear-gradient(145deg,#0d1526,#0a1020)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(52,211,153,.15)',
              animation: 'slideUpL .25s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {/* header */}
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(90deg,rgba(16,185,129,.1),rgba(59,130,246,.1))',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={selected.name} size={40} />
                <div>
                  <h2 style={{
                    margin: 0, fontSize: 15, fontWeight: 700,
                    background: 'linear-gradient(100deg,#e2e8f0,#6ee7b7,#93c5fd)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{selected.name || 'Unknown'}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{selected.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >×</button>
            </div>
            {/* body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Email', value: selected.email },
                { label: 'Date Submitted', value: new Date(selected.created_at).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{value}</p>
                </div>
              ))}
              {/* message gets special treatment — bigger box */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px' }}>Message</p>
                <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selected.message || 'No message provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── mesh bg — teal/green/blue tones for leads ── */
        .ld-main-wrap {
          position: relative; min-height: 100vh;
          background: #060b18; overflow: hidden;
        }
        .ld-main-wrap::before {
          content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 15% 0%,  rgba(16,185,129,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 10%, rgba(59,130,246,0.11) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 10% 85%, rgba(139,92,246,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 90%, rgba(6,182,212,0.09)  0%, transparent 55%);
          animation: meshL 12s ease-in-out infinite alternate;
        }
        @keyframes meshL {
          0%  { opacity:1;   filter:hue-rotate(0deg);   }
          50% { opacity:0.8; filter:hue-rotate(12deg);  }
          100%{ opacity:1;   filter:hue-rotate(-8deg);  }
        }

        /* ── heading ── */
        .ld-heading-grad {
          margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.3px;
          background: linear-gradient(100deg, #e2e8f0 0%, #6ee7b7 45%, #93c5fd 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ld-count-badge {
          background: linear-gradient(135deg, rgba(16,185,129,.15), rgba(59,130,246,.15));
          color: #6ee7b7; font-size: 11px; font-weight: 600; letter-spacing: .4px;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid rgba(110,231,183,.25);
        }
        .ld-new-badge {
          background: rgba(255,255,255,0.05);
          color: #64748b; font-size: 11px; font-weight: 500;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* ── mini summary cards ── */
        .ld-mini-card {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-radius: 14px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          animation: cardInL .4s cubic-bezier(.22,1,.36,1) both;
          transition: transform .2s ease, box-shadow .2s ease;
          cursor: default;
        }
        .ld-mini-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 14px;
          background: var(--mg); opacity: .12; transition: opacity .2s;
        }
        .ld-mini-card::after {
          content: ''; position: absolute; inset: 1px; border-radius: 13px;
          background: linear-gradient(145deg,rgba(10,16,30,.92),rgba(15,23,42,.88));
        }
        .ld-mini-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.5); }
        .ld-mini-card:hover::before { opacity: .22; }
        .ld-mini-card__shimmer {
          position: absolute; top: 0; left: -120%; width: 60%; height: 100%; z-index: 1;
          background: linear-gradient(105deg,transparent,rgba(255,255,255,.11),transparent);
          animation: shimL 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes shimL   { 0%{left:-120%} 55%,100%{left:160%} }
        @keyframes cardInL { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }

        /* ── table card ── */
        .ld-table-card {
          border-radius: 18px; padding: 1.5px;
          background: linear-gradient(135deg,#064e3b,#10b981,#3b82f6);
          transition: box-shadow .25s ease;
        }
        .ld-table-card:hover {
          box-shadow: 0 0 48px -10px rgba(16,185,129,.4), 0 16px 48px rgba(0,0,0,.5);
        }
        .ld-table-card__inner {
          background: linear-gradient(145deg,#0d1526,#0a1020);
          border-radius: 17px; overflow: hidden;
        }

        /* ── rows ── */
        .ld-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background .18s ease;
          animation: rowInL .35s cubic-bezier(.22,1,.36,1) both;
        }
        .ld-row:last-child { border-bottom: none; }
        .ld-row:hover { background: rgba(16,185,129,0.06); }
        @keyframes rowInL { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }

        /* ── spinner ── */
        .ld-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(16,185,129,.15);
          border-top-color: #10b981; border-radius: 50%;
          animation: spinL .75s linear infinite;
        }
        @keyframes spinL { to { transform: rotate(360deg); } }

        /* ── modal anims ── */
        @keyframes fadeInL  { from{opacity:0}       to{opacity:1} }
        @keyframes slideUpL { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }

        @media(max-width:768px) {
          .ld-main-wrap .admin-content > div { padding: 16px 14px 40px !important; }
        }
        @media(prefers-reduced-motion:reduce) {
          .ld-main-wrap::before, .ld-row, .ld-mini-card { animation: none; transition: none; }
          .ld-mini-card__shimmer { animation: none; }
        }
      `}</style>
    </div>
  )
}