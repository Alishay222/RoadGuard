import { useState, useEffect, useRef } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

/* ── animated counter ── */
function useCountUp(target, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) { setValue(0); return }
    let start = null
    const tid = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(step)
        else setValue(target)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(tid)
  }, [target, duration, delay])
  return value
}

/* ── stat card with full gradient background ── */
function StatCard({ label, value, icon, grad, delay }) {
  const count = useCountUp(value, 1100, delay)
  return (
    <div className="dsc" style={{ '--grad': grad, '--shimmer-delay': `${delay * 0.4}ms`, animationDelay: `${delay}ms` }}>
      <div className="dsc__bg" />
      <div className="dsc__shimmer" />
      <div className="dsc__icon">{icon}</div>
      <div className="dsc__text">
        <span className="dsc__num">{count.toLocaleString()}</span>
        <span className="dsc__lbl">{label}</span>
      </div>
    </div>
  )
}

/* ── tooltip ── */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color || p.fill || '#e2e8f0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const AXIS = { fill: '#64748b', fontSize: 12 }
const GRID = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' }

/* ── gradient bar shape — renders gradient fill per bar via SVG ── */
const GradBar = (props) => {
  const { x, y, width, height, fill, gradId } = props
  if (!height || height <= 0) return null
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={1} />
          <stop offset="100%" stopColor={fill} stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height}
        fill={`url(#${gradId})`} rx={props.radius?.[0] || 0} />
    </g>
  )
}

export default function AdminDashboard() {
  const { token, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0, totalAdmins: 0, totalIncidents: 0, activeUsers: 0,
    userDistributionByLocation: [],
  })
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  const locationData = stats.userDistributionByLocation?.length
    ? stats.userDistributionByLocation
    : [{ location: 'No data', activeUsers: 0, inactiveUsers: 0 }]

  const overviewData = [
    { name: 'Total',  value: stats.totalUsers,  color: '#60a5fa' },
    { name: 'Active', value: stats.activeUsers,  color: '#34d399' },
    { name: 'Admins', value: stats.totalAdmins,  color: '#a78bfa' },
  ]
  const incidentData = [{ name: 'Reported', value: stats.totalIncidents }]
  const pieData = [
    { name: 'Admins',        value: stats.totalAdmins },
    { name: 'Regular Users', value: Math.max(0, stats.totalUsers - stats.totalAdmins) },
  ]
  const PIE_COLORS = ['#a78bfa', '#60a5fa']

  useEffect(() => {
    if (authLoading || !token) return
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [authLoading, token])

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.05 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [loading])

  const cards = [
    {
      label: 'Total Users', value: stats.totalUsers, icon: '👥',
      grad: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 60%,#06b6d4 100%)', delay: 0,
    },
    {
      label: 'Active Users', value: stats.activeUsers, icon: '✅',
      grad: 'linear-gradient(135deg,#064e3b 0%,#10b981 60%,#34d399 100%)', delay: 120,
    },
    {
      label: 'Total Admins', value: stats.totalAdmins, icon: '🛡️',
      grad: 'linear-gradient(135deg,#3b0764 0%,#7c3aed 60%,#a78bfa 100%)', delay: 240,
    },
    {
      label: 'Reported Incidents', value: stats.totalIncidents, icon: '⚠️',
      grad: 'linear-gradient(135deg,#78350f 0%,#d97706 60%,#fbbf24 100%)', delay: 360,
    },
  ]

  /* chart card border gradients — one per card */
  const chartMeta = [
    { title: 'User Distribution by Location', glow: '#3b82f6', borderGrad: 'linear-gradient(135deg,#1e3a8a,#06b6d4)', delay: 0 },
    { title: 'User Overview',                 glow: '#06b6d4', borderGrad: 'linear-gradient(135deg,#0e7490,#6366f1)', delay: 80 },
    { title: 'Incidents Report',              glow: '#f59e0b', borderGrad: 'linear-gradient(135deg,#92400e,#fbbf24)', delay: 160 },
    { title: 'Admin Breakdown',               glow: '#8b5cf6', borderGrad: 'linear-gradient(135deg,#4c1d95,#ec4899)', delay: 240 },
  ]

  const charts = [
    /* Location */
    <ResponsiveContainer key="loc" width="100%" height={270}>
      <BarChart data={locationData} barCategoryGap="30%">
        <CartesianGrid {...GRID} />
        <XAxis dataKey="location" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        <Bar dataKey="activeUsers" name="Active Users" stackId="u"
          fill="#3b82f6" radius={[0,0,0,0]}
          shape={(p) => <GradBar {...p} fill="#3b82f6" gradId="gLoc1" />} />
        <Bar dataKey="inactiveUsers" name="Inactive Users" stackId="u"
          fill="#475569" radius={[4,4,0,0]}
          shape={(p) => <GradBar {...p} fill="#475569" gradId="gLoc2" radius={[4,4,0,0]} />} />
      </BarChart>
    </ResponsiveContainer>,

    /* Overview */
    <ResponsiveContainer key="ov" width="100%" height={270}>
      <BarChart data={overviewData} barCategoryGap="40%">
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[6,6,0,0]}
          shape={(p) => <GradBar {...p} fill={p.color} gradId={`gOv${p.index}`} radius={[6,6,0,0]} />}>
          {overviewData.map((d, i) => <Cell key={i} fill={d.color} color={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>,

    /* Incidents */
    <ResponsiveContainer key="inc" width="100%" height={270}>
      <BarChart data={incidentData} barCategoryGap="65%">
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" fill="#f59e0b" radius={[6,6,0,0]}
          shape={(p) => <GradBar {...p} fill="#f59e0b" gradId="gInc" radius={[6,6,0,0]} />} />
      </BarChart>
    </ResponsiveContainer>,

    /* Pie / donut */
    <div key="pie" style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <defs>
            <linearGradient id="pieG0" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="pieG1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <Pie
            data={pieData}
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={95}
            paddingAngle={4} dataKey="value"
            label={({ name, value, cx, cy, midAngle, outerRadius: or }) => {
              const R = Math.PI / 180
              const r = or + 26
              const x = cx + r * Math.cos(-midAngle * R)
              const y = cy + r * Math.sin(-midAngle * R)
              return (
                <text x={x} y={y} fill="#94a3b8" textAnchor="middle"
                  dominantBaseline="central" fontSize={12}>
                  {name}: {value}
                </text>
              )
            }}
            labelLine={false}
          >
            <Cell fill="url(#pieG0)" stroke="none" />
            <Cell fill="url(#pieG1)" stroke="none" />
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{
          fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-1px',
          background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          {stats.totalUsers}
        </span>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 2 }}>Total</span>
      </div>
    </div>,
  ]

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="dashboard" />

      {/* ── main area with animated mesh background ── */}
      <div className="admin-main dash-main-wrap">
        <AdminHeader title="Dashboard" />
        <div className="admin-content" style={{ padding: 0 }}>

          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '60vh', gap: 20, color: '#475569'
            }}>
              <div className="dash-spinner" />
              <p style={{ margin: 0, fontSize: 14 }}>Loading dashboard…</p>
            </div>
          ) : (
            <div style={{ padding: '28px 32px 56px', position: 'relative', zIndex: 1 }}>

              {/* heading with gradient text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <h2 className="dash-heading-grad">Overview</h2>
                <span className="dash-live-badge">● Live</span>
              </div>

              {/* stat cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 18, marginBottom: 32
              }}>
                {cards.map(c => <StatCard key={c.label} {...c} />)}
              </div>

              {/* chart cards */}
              <div
                ref={ref}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                  gap: 20
                }}
              >
                {chartMeta.map(({ title, glow, borderGrad, delay }, i) => (
                  <div
                    key={title}
                    className="dash-chart-card"
                    style={{
                      '--glow': glow,
                      '--bgrad': borderGrad,
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(20px)',
                      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(.22,1,.36,1) ${delay}ms`,
                    }}
                  >
                    {/* gradient border via pseudo — done with box inner */}
                    <div className="dash-chart-card__inner">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: glow, boxShadow: `0 0 8px 2px ${glow}`
                        }} />
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>{title}</h3>
                      </div>
                      {charts[i]}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ── page background: deep moving gradient mesh ── */
        .dash-main-wrap {
          position: relative;
          min-height: 100vh;
          background: #060b18;
          overflow: hidden;
        }
        .dash-main-wrap::before {
          content: '';
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%,   rgba(59,130,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 10%,  rgba(139,92,246,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 10% 80%,  rgba(16,185,129,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 90%,  rgba(6,182,212,0.12)  0%, transparent 55%),
            radial-gradient(ellipse 90% 70% at 50% 50%,  rgba(99,102,241,0.08) 0%, transparent 70%);
          animation: meshShift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes meshShift {
          0%   { opacity: 1;   filter: hue-rotate(0deg); }
          50%  { opacity: 0.8; filter: hue-rotate(15deg); }
          100% { opacity: 1;   filter: hue-rotate(-10deg); }
        }

        /* ── heading gradient text ── */
        .dash-heading-grad {
          margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -.3px;
          background: linear-gradient(100deg, #e2e8f0 0%, #a78bfa 50%, #60a5fa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── live badge with shimmer ── */
        .dash-live-badge {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(6,182,212,.2));
          color: #34d399;
          font-size: 11px; font-weight: 600; letter-spacing: .5px;
          padding: 3px 12px; border-radius: 20px;
          border: 1px solid rgba(52,211,153,.35);
          animation: blink 2.2s ease-in-out infinite;
        }
        .dash-live-badge::after {
          content: '';
          position: absolute; top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer { 0%{left:-75%} 60%,100%{left:150%} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.55} }

        /* ── stat card ── */
        .dsc {
          position: relative; overflow: hidden;
          border-radius: 16px; padding: 22px 20px;
          display: flex; align-items: center; gap: 16px;
          animation: cardIn 0.45s cubic-bezier(.22,1,.36,1) both;
          transition: transform .22s ease, box-shadow .22s ease;
          cursor: default;
          /* border done with gradient pseudo */
          background: transparent;
        }
        /* the actual gradient card face */
        .dsc__bg {
          position: absolute; inset: 1px; border-radius: 15px; z-index: 0;
          background: var(--grad);
          opacity: 0.18;
          transition: opacity .22s ease;
        }
        /* gradient border ring */
        .dsc::before {
          content: '';
          position: absolute; inset: 0; border-radius: 16px; z-index: 0;
          padding: 1px;
          background: var(--grad);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          opacity: 0.7;
        }
        /* dark card fill */
        .dsc::after {
          content: '';
          position: absolute; inset: 1px; border-radius: 15px; z-index: 0;
          background: linear-gradient(145deg, rgba(10,16,30,0.92), rgba(15,23,42,0.88));
        }
        /* moving sheen layer — same trick as live badge */
        .dsc__shimmer {
          position: absolute; top: 0; left: -120%;
          width: 60%; height: 100%; z-index: 1;
          background: linear-gradient(
            105deg,
            transparent 0%,
            rgba(255,255,255,0.04) 40%,
            rgba(255,255,255,0.13) 50%,
            rgba(255,255,255,0.04) 60%,
            transparent 100%
          );
          animation: cardShimmer 3.5s ease-in-out infinite;
          animation-delay: var(--shimmer-delay, 0ms);
          pointer-events: none;
        }
        @keyframes cardShimmer {
          0%          { left: -120%; }
          55%, 100%   { left: 160%;  }
        }

        .dsc:hover .dsc__bg { opacity: 0.32; }
        .dsc:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 48px rgba(0,0,0,.55);
        }
        .dsc__icon, .dsc__text { position: relative; z-index: 2; }
        .dsc__icon {
          font-size: 26px; width: 50px; height: 50px; flex-shrink: 0;
          border-radius: 12px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .dsc__text { display: flex; flex-direction: column; gap: 3px; }
        .dsc__num {
          font-size: 30px; font-weight: 800;
          background: var(--grad);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums;
        }
        .dsc__lbl { font-size: 12px; font-weight: 500; color: #94a3b8; }

        /* ── chart card wrapper with gradient border ── */
        .dash-chart-card {
          position: relative; border-radius: 18px;
          padding: 1.5px; /* border thickness */
          background: var(--bgrad);
          box-shadow: 0 0 0 0 transparent;
          transition:
            opacity 0.55s ease,
            transform 0.55s cubic-bezier(.22,1,.36,1),
            box-shadow .25s ease;
        }
        .dash-chart-card:hover {
          box-shadow: 0 0 40px -8px var(--glow), 0 12px 40px rgba(0,0,0,.45);
        }
        .dash-chart-card__inner {
          background: linear-gradient(145deg, #0d1526, #0a1020);
          border-radius: 17px;
          padding: 20px 20px 12px;
        }

        /* ── spinner ── */
        .dash-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(99,102,241,.15);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin .75s linear infinite;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── responsive ── */
        @media (max-width: 768px) {
          .dash-main-wrap > .admin-content > div { padding: 16px 14px 40px !important; }
          .dsc__num { font-size: 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-main-wrap::before,
          .dash-live-badge::after,
          .dsc__shimmer { animation: none; }
          .dsc, .dash-chart-card { transition: none; animation: none; }
        }
      `}</style>
    </div>
  )
}