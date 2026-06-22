import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard  from './pages/Dashboard.jsx'
import Products   from './pages/Products.jsx'
import Customers  from './pages/Customers.jsx'
import Orders     from './pages/Orders.jsx'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: '📊' },
  { to: '/products',  label: 'Products',   icon: '📦' },
  { to: '/customers', label: 'Customers',  icon: '👥' },
  { to: '/orders',    label: 'Orders',     icon: '🛒' },
]

const PAGE_META = {
  '/':          { title: 'Dashboard',        desc: 'Overview of your inventory and operations' },
  '/products':  { title: 'Products',         desc: 'Manage your product catalog and stock levels' },
  '/customers': { title: 'Customers',        desc: 'View and manage customer records' },
  '/orders':    { title: 'Orders',           desc: 'Track and manage customer orders' },
}

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={onClose}
        />
      )}
      <nav className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <h1>📦 InvenTrack</h1>
          <span>Inventory & Order Management</span>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-footer">
          InvenTrack v1.0.0 &copy; {new Date().getFullYear()}
        </div>
      </nav>
    </>
  )
}

function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const meta = PAGE_META[location.pathname] || { title: 'Page', desc: '' }

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header className="page-header">
          <div>
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <h2>{meta.title}</h2>
            <p>{meta.desc}</p>
          </div>
        </header>
        <div className="page-body">
          <Routes>
            <Route path="/"          element={<Dashboard />}  />
            <Route path="/products"  element={<Products />}   />
            <Route path="/customers" element={<Customers />}  />
            <Route path="/orders"    element={<Orders />}     />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
