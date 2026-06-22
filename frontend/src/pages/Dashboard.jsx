import { useState, useEffect } from 'react'
import { getDashboard } from '../services/api'

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>{icon}</div>
      <div className="stat-info">
        <div className="label">{label}</div>
        <div className="value">{value ?? '—'}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getDashboard()
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span className="text-muted">Loading dashboard…</span>
    </div>
  )

  if (error) return (
    <div className="alert alert-danger" style={{ marginTop: 0 }}>
      <span>⚠️</span> {error}
    </div>
  )

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="📦" label="Total Products"  value={data.total_products}  colorClass="blue"   />
        <StatCard icon="👥" label="Total Customers" value={data.total_customers} colorClass="green"  />
        <StatCard icon="🛒" label="Total Orders"    value={data.total_orders}    colorClass="purple" />
        <StatCard icon="⚠️" label="Low Stock Items" value={data.low_stock_products.length} colorClass="amber" />
      </div>

      <div className="card">
        <div className="section-header">
          <h3>⚠️ Low Stock Alert</h3>
          <span className="badge badge-warning">&lt; 10 units</span>
        </div>

        {data.low_stock_products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <p>All products are well-stocked!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Qty in Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.low_stock_products.map(p => (
                  <tr key={p.id} className="low-stock-row">
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge badge-info font-mono">{p.sku}</span></td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      {p.quantity_in_stock === 0
                        ? <span className="badge badge-danger">Out of Stock</span>
                        : <span className="badge badge-warning">Low Stock</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
