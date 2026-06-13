import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminIncidents() {
  const { token, loading: authLoading } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !token) {
      return
    }

    fetchIncidents()
  }, [authLoading, token])

  const fetchIncidents = async () => {
    try {
      const url = `${API_BASE_URL}/api/admin/incidents`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="incidents" />
      <div className="admin-main">
        <AdminHeader title="Incidents Management" />
        <div className="admin-content">
          <div className="admin-table-container">
            <div className="admin-table__header">
              <h3 className="admin-table__title">Incidents ({incidents.length})</h3>
            </div>
            {incidents.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Reported By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident._id}>
                      <td>{incident.incident_type}</td>
                      <td>{incident.location || 'N/A'}</td>
                      <td>{incident.user_email || 'Anonymous'}</td>
                      <td>{new Date(incident.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                {loading ? 'Loading incidents...' : 'No incidents found'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
