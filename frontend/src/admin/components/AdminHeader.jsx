import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import '../styles/admin.css'

export default function AdminHeader({ title }) {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useAdmin()
  const [hoverOpen, setHoverOpen] = useState(false)
  const [menuPinned, setMenuPinned] = useState(false)
  const menuRef = useRef(null)

  const displayName = user?.name || user?.email || 'Admin'
  const menuOpen = hoverOpen || menuPinned

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setHoverOpen(false)
        setMenuPinned(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div className="admin-header">
      <button
        type="button"
        className="admin-header__toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <h1 className="admin-header__title">{title}</h1>
      <div className="admin-header__actions">
        {user && (
          <div
            className="admin-user-menu"
            ref={menuRef}
            onMouseEnter={() => setHoverOpen(true)}
            onMouseLeave={() => setHoverOpen(false)}
          >
            <button
              type="button"
              className="admin-user-menu__trigger"
              onClick={() => setMenuPinned((previous) => !previous)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Admin profile menu"
            >
              <span className="admin-user-menu__icon">👤</span>
            </button>
            {menuOpen && (
              <div className="admin-user-menu__dropdown">
                <div className="admin-user-menu__name">{displayName}</div>
                <button type="button" className="admin-user-menu__logout" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
