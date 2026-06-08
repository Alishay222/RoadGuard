import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AppProduct from './pages/AppProduct'
import AppLoader from './pages/AppLoader'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminUsers from './admin/pages/AdminUsers'
import AdminIncidents from './admin/pages/AdminIncidents'
import AdminLeads from './admin/pages/AdminLeads'
import AdminSettings from './admin/pages/AdminSettings'
import AdminRouteGuard from './admin/pages/AdminRouteGuard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLoader />} />
      <Route path="/app/product" element={<AppProduct />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRouteGuard />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="incidents" element={<AdminIncidents />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}

export default App
