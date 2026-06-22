import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getOrders, createOrder, deleteOrder, getCustomers, getProducts } from '../services/api'

const EMPTY_ITEM = { product_id: '', quantity: '' }

function CreateOrderModal({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([c, p]) => { setCustomers(c.data); setProducts(p.data) })
      .catch(() => toast.error('Failed to load data.'))
      .finally(() => setFetching(false))
  }, [])

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
    setErrors(er => { const e = { ...er }; delete e[`item_${idx}_${field}`]; return e })
  }

  const validate = () => {
    const errs = {}
    if (!customerId) errs.customerId = 'Please select a customer.'
    if (items.length === 0) errs.items = 'Add at least one item.'
    items.forEach((item, idx) => {
      if (!item.product_id) errs[`item_${idx}_product_id`] = 'Select a product.'
      const qty = parseInt(item.quantity, 10)
      if (!item.quantity || isNaN(qty) || qty <= 0) errs[`item_${idx}_quantity`] = 'Enter a valid quantity.'
    })
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await createOrder({
        customer_id: parseInt(customerId, 10),
        items: items.map(item => ({
          product_id: parseInt(item.product_id, 10),
          quantity:   parseInt(item.quantity, 10),
        })),
      })
      toast.success('Order created successfully!')
      onSaved()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create order.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const getProductStock = (productId) => {
    const p = products.find(p => p.id === parseInt(productId, 10))
    return p ? p.quantity_in_stock : null
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>🛒 Create New Order</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {fetching ? (
          <div className="modal-body"><div className="spinner-wrap"><div className="spinner" /></div></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="order-customer">Customer *</label>
                <select
                  id="order-customer"
                  className={`form-control${errors.customerId ? ' error' : ''}`}
                  value={customerId}
                  onChange={e => { setCustomerId(e.target.value); setErrors(er => ({ ...er, customerId: undefined })) }}
                >
                  <option value="">— Select a customer —</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
                {errors.customerId && <div className="field-error">{errors.customerId}</div>}
              </div>

              <div className="divider" />

              <div className="section-header">
                <label style={{ fontWeight: 600, fontSize: 14 }}>Order Items *</label>
                <button type="button" className="btn btn-sm btn-ghost" onClick={addItem}>➕ Add Item</button>
              </div>

              {errors.items && <div className="field-error mb-4">{errors.items}</div>}

              {items.map((item, idx) => {
                const stock = getProductStock(item.product_id)
                return (
                  <div key={idx} className="order-item-row">
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Product</label>
                      <select
                        id={`order-product-${idx}`}
                        className={`form-control${errors[`item_${idx}_product_id`] ? ' error' : ''}`}
                        value={item.product_id}
                        onChange={e => updateItem(idx, 'product_id', e.target.value)}
                      >
                        <option value="">— Select product —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${p.price.toFixed(2)} (Stock: {p.quantity_in_stock})
                          </option>
                        ))}
                      </select>
                      {errors[`item_${idx}_product_id`] && <div className="field-error">{errors[`item_${idx}_product_id`]}</div>}
                      {stock !== null && <div className="text-muted text-sm mt-1">Available: {stock} units</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Qty</label>
                      <input
                        id={`order-qty-${idx}`}
                        type="number"
                        min="1"
                        className={`form-control${errors[`item_${idx}_quantity`] ? ' error' : ''}`}
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        placeholder="1"
                      />
                      {errors[`item_${idx}_quantity`] && <div className="field-error">{errors[`item_${idx}_quantity`]}</div>}
                    </div>
                    <div style={{ paddingTop: 22 }}>
                      {items.length > 1 && (
                        <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeItem(idx)} title="Remove item">✕</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Creating…' : '✅ Create Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>📋 Order #{order.id} Details</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid mb-4">
            <div className="detail-item">
              <div className="detail-label">Order ID</div>
              <div className="detail-value">#{order.id}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Date</div>
              <div className="detail-value">{new Date(order.created_at).toLocaleString()}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Customer</div>
              <div className="detail-value">{order.customer?.full_name || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{order.customer?.email || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{order.customer?.phone_number || 'N/A'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Total Amount</div>
              <div className="detail-value" style={{ color: 'var(--success)', fontWeight: 700, fontSize: 18 }}>
                ${order.total_amount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="divider" />
          <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)' }}>ORDER ITEMS</h4>

          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name || `Product #${item.product_id}`}</td>
                    <td>${item.unit_price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td><strong>${(item.unit_price * item.quantity).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
            Total: ${order.total_amount.toFixed(2)}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ orderId, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>🗑️ Cancel Order</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Cancel <strong>Order #{orderId}</strong>? Stock will be automatically restored. This cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Keep Order</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [viewOrder, setViewOrder]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)

  const fetchOrders = () => {
    setLoading(true)
    getOrders()
      .then(res => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteOrder(deleteTarget.id)
      toast.success(`Order #${deleteTarget.id} cancelled. Stock restored.`)
      setDeleteTarget(null)
      fetchOrders()
    } catch {
      toast.error('Failed to cancel order.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="section-header mb-6">
        <h3>All Orders</h3>
        <button id="create-order-btn" className="btn btn-success" onClick={() => setShowCreate(true)}>
          🛒 Create Order
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🛒</div>
            <p>No orders yet. Create your first order!</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><span className="badge badge-purple">#{order.id}</span></td>
                  <td>
                    <strong>{order.customer?.full_name || 'N/A'}</strong>
                    <div className="td-muted text-sm">{order.customer?.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td><strong style={{ color: 'var(--success)' }}>${order.total_amount.toFixed(2)}</strong></td>
                  <td className="td-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button id={`view-order-${order.id}`} className="btn btn-sm btn-info" onClick={() => setViewOrder(order)}>📋 View</button>
                      <button id={`cancel-order-${order.id}`} className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(order)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={fetchOrders}
        />
      )}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          orderId={deleteTarget.id}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
