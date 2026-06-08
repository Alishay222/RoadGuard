import { useState, useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import { useAuth } from '../../context/AuthContext'
import '../styles/admin.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AdminUsers() {
  const { token, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    if (authLoading || !token) {
      return
    }

    fetchUsers()
  }, [authLoading, token])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=5000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowDetails(true)
  }

  const handleDeleteUser = (user) => {
    setConfirmDialog({
      type: 'delete',
      user,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`,
    })
  }

  const handleToggleStatus = (user) => {
    const newStatus = !user.is_active
    setConfirmDialog({
      type: 'status',
      user,
      newStatus,
      title: newStatus ? 'Activate User' : 'Deactivate User',
      message: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${user.name || user.email}?`,
    })
  }

  const handleToggleAdmin = (user) => {
    const newAdminState = !user.is_admin
    setConfirmDialog({
      type: 'admin',
      user,
      newAdminState,
      title: newAdminState ? 'Make Admin' : 'Remove Admin',
      message: `Are you sure you want to ${newAdminState ? 'grant admin access to' : 'remove admin access from'} ${user.name || user.email}?`,
    })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return
    
    setActionLoading(confirmDialog.user._id)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      
      if (confirmDialog.type === 'delete') {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${confirmDialog.user._id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          setUsers(users.filter(u => u._id !== confirmDialog.user._id))
          alert('User deleted successfully')
        } else {
          const data = await response.json()
          alert(`Error: ${data.detail || 'Failed to delete user'}`)
        }
      } else if (confirmDialog.type === 'status') {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/users/${confirmDialog.user._id}/status?active=${confirmDialog.newStatus}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          // Update the user's status in the local state
          setUsers(users.map(u => 
            u._id === confirmDialog.user._id 
              ? { ...u, is_active: confirmDialog.newStatus }
              : u
          ))
          alert(`User ${confirmDialog.newStatus ? 'activated' : 'deactivated'} successfully`)
        } else {
          const data = await response.json()
          alert(`Error: ${data.detail || 'Failed to update user status'}`)
        }
      } else if (confirmDialog.type === 'admin') {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/users/${confirmDialog.user._id}/admin?admin=${confirmDialog.newAdminState}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          setUsers(users.map(u => 
            u._id === confirmDialog.user._id 
              ? { ...u, is_admin: confirmDialog.newAdminState }
              : u
          ))
          alert(`Admin access ${confirmDialog.newAdminState ? 'granted' : 'revoked'} successfully`)
        } else {
          const data = await response.json()
          alert(`Error: ${data.detail || 'Failed to update admin role'}`)
        }
      }
      
      setConfirmDialog(null)
    } catch (error) {
      console.error('Action failed:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="users" />
      <div className="admin-main">
        <AdminHeader title="User Management" />
        <div className="admin-content">
          <div className="admin-table-container admin-table-container--scroll">
            <div className="admin-table__header">
              <h3 className="admin-table__title">All Users ({users.length})</h3>
            </div>
            {users.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} style={{ opacity: user.is_active === false ? 0.6 : 1 }}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>{user.city || '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.is_active === false ? '#fee' : '#dbeafe',
                          color: user.is_active === false ? '#991b1b' : '#075985',
                        }}>
                          {user.is_active === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: user.is_admin ? '#dcfce7' : '#f1f5f9',
                          color: user.is_admin ? '#166534' : '#475569',
                        }}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            className="admin-table__btn admin-table__btn--view"
                            onClick={() => handleViewUser(user)}
                            disabled={actionLoading === user._id}
                          >
                            View
                          </button>
                          <button
                            className="admin-table__btn"
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user._id}
                            style={{
                              background: user.is_active === false ? '#e0f2fe' : '#fef3c7',
                              color: user.is_active === false ? '#075985' : '#92400e',
                            }}
                          >
                            {user.is_active === false ? 'Activate' : 'Deactivate'}
                          </button>
                          <button
                            className="admin-table__btn"
                            onClick={() => handleToggleAdmin(user)}
                            disabled={actionLoading === user._id}
                            style={{
                              background: user.is_admin ? '#f3e8ff' : '#dcfce7',
                              color: user.is_admin ? '#7e22ce' : '#166534',
                            }}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            className="admin-table__btn admin-table__btn--delete"
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                {loading ? 'Loading users...' : 'No users found'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="admin-modal" onClick={() => setShowDetails(false)}>
          <div className="admin-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">User Details</h2>
              <button
                className="admin-modal__close"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Name</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Email</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Phone</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Language Preference</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.language_preference || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Status</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedUser.is_active === false ? '#fee' : '#dbeafe',
                      color: selectedUser.is_active === false ? '#991b1b' : '#075985',
                    }}>
                      {selectedUser.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Role</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedUser.is_admin ? '#dcfce7' : '#f1f5f9',
                      color: selectedUser.is_admin ? '#166534' : '#475569',
                    }}>
                      {selectedUser.is_admin ? 'Admin' : 'User'}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>City</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.city || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Vehicle Type</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.vehicle_type || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>License Plate</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.license_plate || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Experience</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.driving_experience || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Emergency Contact</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.emergency_contact_name || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Emergency Phone</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{selectedUser.emergency_contact_phone || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Joined</p>
                  <p style={{ fontSize: '14px', fontWeight: '600' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="admin-modal" onClick={() => setConfirmDialog(null)}>
          <div className="admin-modal__content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">{confirmDialog.title}</h2>
              <button
                className="admin-modal__close"
                onClick={() => setConfirmDialog(null)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <p style={{ marginBottom: '20px', color: '#333' }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmDialog(null)}
                  style={{
                    padding: '10px 20px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 20px',
                    background: confirmDialog.type === 'delete' ? '#dc2626' : '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  {actionLoading ? 'Processing...' : confirmDialog.type === 'delete' ? 'Delete' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
