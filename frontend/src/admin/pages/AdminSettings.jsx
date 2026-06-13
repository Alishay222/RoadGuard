import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import '../styles/admin.css'

export default function AdminSettings() {
  return (
    <div className="admin-layout">
      <AdminSidebar currentPage="settings" />
      <div className="admin-main">
        <AdminHeader title="Settings" />
        <div className="admin-content">
          <div className="admin-table-container">
            <div className="admin-table__header">
              <h3 className="admin-table__title">System Settings</h3>
            </div>
            <div style={{ padding: '30px' }}>
              <div className="admin-form__group">
                <label className="admin-form__label">Application Name</label>
                <input type="text" className="admin-form__input" value="RoadGuard" disabled />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Support Email</label>
                <input type="email" className="admin-form__input" value="support@roadguard.app" />
              </div>
              <div className="admin-form__group">
                <label className="admin-form__label">Admin Email</label>
                <input type="email" className="admin-form__input" placeholder="admin@roadguard.app" />
              </div>
              <button className="admin-form__submit">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
