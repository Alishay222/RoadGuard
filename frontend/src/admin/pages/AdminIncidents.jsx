import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

/* ── incident type badge ── */
const TYPE_STYLES = {
  accident:    { bg: 'linear-gradient(135deg,#7f1d1d,#dc2626)', color: '#fca5a5', border: 'rgba(239,68,68,.3)',    icon: '🚨' },
  hazard:      { bg: 'linear-gradient(135deg,#78350f,#d97706)', color: '#fcd34d', border: 'rgba(251,191,36,.3)',   icon: '⚠️' },
  roadblock:   { bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', color: '#93c5fd', border: 'rgba(59,130,246,.3)',   icon: '🚧' },
  flood:       { bg: 'linear-gradient(135deg,#0c4a6e,#0891b2)', color: '#67e8f9', border: 'rgba(6,182,212,.3)',    icon: '🌊' },
  fire:        { bg: 'linear-gradient(135deg,#7c2d12,#ea580c)', color: '#fdba74', border: 'rgba(249,115,22,.3)',   icon: '🔥' },
  theft:       { bg: 'linear-gradient(135deg,#3b0764,#7c3aed)', color: '#c4b5fd', border: 'rgba(139,92,246,.3)',   icon: '🔓' },
  medical:     { bg: 'linear-gradient(135deg,#064e3b,#10b981)', color: '#6ee7b7', border: 'rgba(52,211,153,.3)',   icon: '🏥' },
}
const defaultType = { bg: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#94a3b8', border: 'rgba(148,163,184,.2)', icon: '📋' }

function TypeBadge({ type }) {
  const key = (type || '').toLowerCase()
  const s = Object.entries(TYPE_STYLES).find(([k]) => key.includes(k))?.[1] || defaultType
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '.4px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span>{s.icon}</span>
      {type || 'Unknown'}
    </span>
  )
}

/* ── location pill ── */
function LocationPill({ value }) {
  if (!value || value === 'N/A') return <span style={{ color: '#475569', fontSize: 13 }}>—</span>
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 13, color: '#94a3b8',
    }}>
      <span style={{ fontSize: 12 }}>📍</span>
      {value}
    </span>
  )
}

/* ── reporter cell ── */
function Reporter({ email }) {
  if (!email || email === 'Anonymous') return (
    <span style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>Anonymous</span>
  )
  const initials = email.slice(0, 2).toUpperCase()
  const hue = [...email].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg,hsl(${hue},65%,30%),hsl(${(hue+60)%360},75%,50%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.07)',
      }}>{initials}</div>
      <span style={{ fontSize: 12, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
    </div>
  )
}

/* ── row number ── */
function RowNum({ n }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: 6,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      fontSize: 11, fontWeight: 600, color: '#475569',
    }}>{n}</span>
  )
}

export default function AdminIncidents() {
  const { token, loading: authLoading } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (authLoading || !token) return
    fetchIncidents()
  }, [authLoading, token])

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setIncidents(data.incidents || [])
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = incidents.filter(i =>
    !search ||
    (i.incident_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.location      || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.user_email    || '').toLowerCase().includes(search.toLowerCase())
  )

  /* summary counts by type */
  const typeCounts = incidents.reduce((acc, i) => {
    const k = (i.incident_type || 'Other')
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const topTypes = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).slice(0,4)

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="incidents" />

      <div className="admin-main inc-main-wrap">
        <AdminHeader title="Incidents Management" />
        <div className="admin-content" style={{ padding: 0 }}>
          <div style={{ padding: '28px 32px 56px', position: 'relative', zIndex: 1 }}>

            {/* ── heading row ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 className="inc-heading-grad">Incidents</h2>
                <span className="inc-count-badge">⚠️ {incidents.length} reported</span>
              </div>
              {/* search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#475569', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search incidents…"
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '8px 14px 8px 34px',
                    fontSize: 13, color: '#e2e8f0', outline: 'none', width: 220,
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(245,158,11,.5)'; e.target.style.boxShadow='0 0 0 3px rgba(245,158,11,.1)' }}
                  onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,.1)'; e.target.style.boxShadow='none' }}
                />
              </div>
            </div>

            {/* ── summary mini-cards ── */}
            {!loading && topTypes.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {topTypes.map(([type, count]) => {
                  const key = type.toLowerCase()
                  const s = Object.entries(TYPE_STYLES).find(([k]) => key.includes(k))?.[1] || defaultType
                  return (
                    <div key={type} className="inc-mini-card" style={{ '--mg': s.bg, '--mc': s.color, '--mb': s.border }}>
                      <div className="inc-mini-card__shimmer" />
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <div>
                        <p style={{ margin:0, fontSize:18, fontWeight:800, color: s.color, lineHeight:1, letterSpacing:'-0.5px' }}>{count}</p>
                        <p style={{ margin:0, fontSize:11, color:'#64748b', fontWeight:500, marginTop:2 }}>{type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── table card ── */}
            <div className="inc-table-card">
              <div className="inc-table-card__inner">
                {loading ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:16, color:'#475569' }}>
                    <div className="inc-spinner" />
                    <p style={{ margin:0, fontSize:14 }}>Loading incidents…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 0', color:'#475569', fontSize:14 }}>
                    {search ? 'No incidents match your search.' : 'No incidents reported yet.'}
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                      <thead>
                        <tr>
                          {['#', 'Type', 'Location', 'Reported By', 'Date'].map(h => (
                            <th key={h} style={{
                              padding:'12px 14px', textAlign:'left',
                              fontSize:11, fontWeight:600, letterSpacing:'.6px',
                              color:'#64748b', textTransform:'uppercase',
                              borderBottom:'1px solid rgba(255,255,255,0.07)',
                              whiteSpace:'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((incident, idx) => (
                          <tr
                            key={incident._id}
                            className="inc-row"
                            style={{ animationDelay:`${Math.min(idx,20)*25}ms`, cursor:'pointer' }}
                            onClick={() => setSelected(incident)}
                          >
                            <td style={{ padding:'13px 14px' }}><RowNum n={idx+1} /></td>
                            <td style={{ padding:'13px 14px' }}><TypeBadge type={incident.incident_type} /></td>
                            <td style={{ padding:'13px 14px' }}><LocationPill value={incident.location} /></td>
                            <td style={{ padding:'13px 14px' }}><Reporter email={incident.user_email} /></td>
                            <td style={{ padding:'13px 14px', fontSize:12, color:'#64748b', whiteSpace:'nowrap' }}>
                              {new Date(incident.created_at).toLocaleDateString()}
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

      {/* ── incident detail modal ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position:'fixed', inset:0, zIndex:1000,
            background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:'fadeInI .2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:'90%', maxWidth:480,
              background:'linear-gradient(145deg,#0d1526,#0a1020)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:20, overflow:'hidden',
              boxShadow:'0 32px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(245,158,11,.15)',
              animation:'slideUpI .25s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {/* modal header */}
            <div style={{
              padding:'18px 24px',
              background:'linear-gradient(90deg,rgba(245,158,11,.1),rgba(239,68,68,.1))',
              borderBottom:'1px solid rgba(255,255,255,0.07)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>
                  {(Object.entries(TYPE_STYLES).find(([k]) => (selected.incident_type||'').toLowerCase().includes(k))?.[1] || defaultType).icon}
                </span>
                <h2 style={{
                  margin:0, fontSize:16, fontWeight:700,
                  background:'linear-gradient(100deg,#fcd34d,#fb923c)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                }}>{selected.incident_type || 'Incident'}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width:28, height:28, borderRadius:'50%', border:'none',
                  background:'rgba(255,255,255,0.08)', color:'#94a3b8',
                  cursor:'pointer', fontSize:16,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              >×</button>
            </div>
            {/* modal body */}
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Location',    value: selected.location   || 'N/A' },
                { label:'Reported By', value: selected.user_email || 'Anonymous' },
                { label:'Date',        value: new Date(selected.created_at).toLocaleString() },
                ...(selected.description ? [{ label:'Description', value: selected.description }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:10, padding:'12px 14px',
                }}>
                  <p style={{ margin:'0 0 4px', fontSize:11, color:'#64748b', fontWeight:500, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── mesh bg ── */
        .inc-main-wrap {
          position:relative; min-height:100vh;
          background:#060b18; overflow:hidden;
        }
        .inc-main-wrap::before {
          content:''; position:absolute; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(ellipse 80% 50% at 15% 0%,  rgba(239,68,68,0.10)  0%,transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 10%, rgba(245,158,11,0.12) 0%,transparent 55%),
            radial-gradient(ellipse 50% 60% at 10% 85%, rgba(59,130,246,0.08) 0%,transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 90%, rgba(139,92,246,0.09) 0%,transparent 55%);
          animation:meshI 12s ease-in-out infinite alternate;
        }
        @keyframes meshI {
          0%  {opacity:1;  filter:hue-rotate(0deg);}
          50% {opacity:.8; filter:hue-rotate(12deg);}
          100%{opacity:1;  filter:hue-rotate(-8deg);}
        }

        /* ── heading ── */
        .inc-heading-grad {
          margin:0; font-size:22px; font-weight:800; letter-spacing:-.3px;
          background:linear-gradient(100deg,#e2e8f0 0%,#fcd34d 45%,#fb923c 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .inc-count-badge {
          background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(239,68,68,.15));
          color:#fcd34d; font-size:11px; font-weight:600; letter-spacing:.4px;
          padding:3px 10px; border-radius:20px;
          border:1px solid rgba(252,211,77,.25);
        }

        /* ── mini summary cards ── */
        .inc-mini-card {
          position:relative; overflow:hidden;
          display:flex; align-items:center; gap:12px;
          padding:14px 18px; border-radius:14px;
          border:1px solid var(--mb);
          background:transparent;
          cursor:default;
          animation:cardInI .4s cubic-bezier(.22,1,.36,1) both;
          transition:transform .2s ease, box-shadow .2s ease;
        }
        .inc-mini-card::before {
          content:''; position:absolute; inset:0; border-radius:14px;
          background:var(--mg); opacity:.12;
          transition:opacity .2s;
        }
        .inc-mini-card::after {
          content:''; position:absolute; inset:1px; border-radius:13px;
          background:linear-gradient(145deg,rgba(10,16,30,.92),rgba(15,23,42,.88));
        }
        .inc-mini-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,.5); }
        .inc-mini-card:hover::before { opacity:.22; }
        .inc-mini-card__shimmer {
          position:absolute; top:0; left:-120%; width:60%; height:100%; z-index:1;
          background:linear-gradient(105deg,transparent,rgba(255,255,255,.11),transparent);
          animation:shimI 3.5s ease-in-out infinite;
          pointer-events:none;
        }
        .inc-mini-card > * { position:relative; z-index:2; }
        @keyframes shimI  { 0%{left:-120%} 55%,100%{left:160%} }
        @keyframes cardInI{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }

        /* ── table card ── */
        .inc-table-card {
          border-radius:18px; padding:1.5px;
          background:linear-gradient(135deg,#92400e,#d97706,#dc2626);
          transition:box-shadow .25s ease;
        }
        .inc-table-card:hover {
          box-shadow:0 0 48px -10px rgba(245,158,11,.4), 0 16px 48px rgba(0,0,0,.5);
        }
        .inc-table-card__inner {
          background:linear-gradient(145deg,#0d1526,#0a1020);
          border-radius:17px; overflow:hidden;
        }

        /* ── rows ── */
        .inc-row {
          border-bottom:1px solid rgba(255,255,255,0.05);
          transition:background .18s ease;
          animation:rowInI .35s cubic-bezier(.22,1,.36,1) both;
        }
        .inc-row:last-child { border-bottom:none; }
        .inc-row:hover { background:rgba(245,158,11,0.06); }
        @keyframes rowInI{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}

        /* ── spinner ── */
        .inc-spinner {
          width:40px; height:40px;
          border:3px solid rgba(245,158,11,.15);
          border-top-color:#f59e0b; border-radius:50%;
          animation:spinI .75s linear infinite;
        }
        @keyframes spinI { to{transform:rotate(360deg)} }

        /* ── modal anims ── */
        @keyframes fadeInI  {from{opacity:0}       to{opacity:1}}
        @keyframes slideUpI {from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}

        @media(max-width:768px){
          .inc-main-wrap .admin-content>div{padding:16px 14px 40px!important;}
        }
        @media(prefers-reduced-motion:reduce){
          .inc-main-wrap::before,.inc-row,.inc-mini-card{animation:none;transition:none;}
          .inc-mini-card__shimmer{animation:none;}
        }
      `}</style>
    </div>
  )
}