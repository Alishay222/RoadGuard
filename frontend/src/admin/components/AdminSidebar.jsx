import { Link } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import '../styles/admin.css'

export default function AdminSidebar({ currentPage }) {
  const { sidebarOpen, toggleSidebar } = useAdmin()
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin' },
    { id: 'users', label: 'Users', path: '/admin/users' },
    { id: 'incidents', label: 'Incidents', path: '/admin/incidents' },
    { id: 'leads', label: 'Leads', path: '/admin/leads' },
    
  ]

  const handleLinkClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      toggleSidebar()
    }
  }

  return (
    <div className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--closed'}`}>
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__logo">
          <img src="/RoadGuardLogo.png" alt="RoadGuard" className="admin-sidebar__logo-img" />
          <span className="admin-sidebar__title">RoadGuard Admin</span>
        </div>
      </div>
      <nav>
        <ul className="admin-sidebar__nav">
          {navItems.map((item) => (
            <li key={item.id} className="admin-sidebar__nav-item">
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`admin-sidebar__nav-link ${currentPage === item.id ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-sidebar__footer">
        <p className="admin-sidebar__version">RoadGuard</p>
        <p className="admin-sidebar__version-number">v1.1.1</p>
      </div>
    </div>
  )
}
