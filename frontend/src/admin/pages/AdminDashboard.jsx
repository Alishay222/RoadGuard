import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminDashboard() {
  const { token, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalIncidents: 0,
    activeUsers: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !token) {
      return
    }

    fetchDashboardData()
  }, [authLoading, token])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from backend
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="dashboard" />
      <div className="admin-main">
        <AdminHeader title="Dashboard" />
        <div className="admin-content">
          <div className="admin-dashboard">
            {/* Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-card__label">Total Users</div>
                <div className="admin-stat-card__value">{stats.totalUsers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card__label">Active Users</div>
                <div className="admin-stat-card__value">{stats.activeUsers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card__label">Total Admins</div>
                <div className="admin-stat-card__value">{stats.totalAdmins}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-card__label">Reported Incidents</div>
                <div className="admin-stat-card__value">{stats.totalIncidents}</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="admin-charts-grid">
              {/* Pie Chart - User Distribution */}
              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">User Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active Users', value: stats.activeUsers, fill: '#4299e1' },
                        { name: 'Inactive Users', value: Math.max(0, stats.totalUsers - stats.activeUsers), fill: '#cbd5e0' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#4299e1" />
                      <Cell fill="#cbd5e0" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - User Stats */}
              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">User Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Total', value: stats.totalUsers },
                    { name: 'Active', value: stats.activeUsers },
                    { name: 'Admins', value: stats.totalAdmins },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4299e1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Incidents */}
              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">Incidents Report</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Reported', value: stats.totalIncidents },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Admin vs Regular Users */}
              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">Admin Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Admins', value: stats.totalAdmins, fill: '#10b981' },
                        { name: 'Regular Users', value: Math.max(0, stats.totalUsers - stats.totalAdmins), fill: '#6366f1' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
