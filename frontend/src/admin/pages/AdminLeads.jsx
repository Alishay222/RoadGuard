import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminLeads() {
  const { token, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !token) {
      return
    }

    fetchLeads()
  }, [authLoading, token])

  const fetchLeads = async () => {
    try {
      const url = `${API_BASE_URL}/api/admin/leads`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="leads" />
      <div className="admin-main">
        <AdminHeader title="Contact Form Submissions" />
        <div className="admin-content">
          <div className="admin-table-container">
            <div className="admin-table__header">
              <h3 className="admin-table__title">Leads ({leads.length})</h3>
            </div>
            {leads.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>{lead.name}</td>
                      <td>{lead.email}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.message}
                      </td>
                      <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                {loading ? 'Loading submissions...' : 'No submissions yet'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
