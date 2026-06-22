import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getCustomers, createCustomer, deleteCustomer } from '../services/api'

const EMPTY_FORM = { full_name: '', email: '', phone_number: '' }

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate(form) {
  const errors = {}
  if (!form.full_name.trim())   errors.full_name    = 'Full name is required.'
  if (!form.email.trim())       errors.email        = 'Email is required.'
  else if (!validateEmail(form.email)) errors.email = 'Enter a valid email address.'
  if (!form.phone_number.trim()) errors.phone_number = 'Phone number is required.'
  return errors
}

function AddCustomerModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: undefined }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await createCustomer({
        full_name:    form.full_name.trim(),
        email:        form.email.trim().toLowerCase(),
        phone_number: form.phone_number.trim(),
      })
      toast.success('Customer added successfully!')
      onSaved()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || 'An error occurred.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>➕ Add Customer</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="cust-name">Full Name *</label>
              <input id="cust-name" name="full_name" className={`form-control${errors.full_name ? ' error' : ''}`} value={form.full_name} onChange={handleChange} placeholder="e.g. John Doe" />
              {errors.full_name && <div className="field-error">{errors.full_name}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="cust-email">Email *</label>
              <input id="cust-email" name="email" type="email" className={`form-control${errors.email ? ' error' : ''}`} value={form.email} onChange={handleChange} placeholder="e.g. john@example.com" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="cust-phone">Phone Number *</label>
              <input id="cust-phone" name="phone_number" className={`form-control${errors.phone_number ? ' error' : ''}`} value={form.phone_number} onChange={handleChange} placeholder="e.g. +1 555-0100" />
              {errors.phone_number && <div className="field-error">{errors.phone_number}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ customerName, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>🗑️ Delete Customer</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = () => {
    setLoading(true)
    getCustomers()
      .then(res => setCustomers(res.data))
      .catch(() => toast.error('Failed to load customers.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCustomer(deleteTarget.id)
      toast.success(`"${deleteTarget.full_name}" deleted.`)
      setDeleteTarget(null)
      fetchCustomers()
    } catch {
      toast.error('Failed to delete customer.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="section-header mb-6">
        <h3>All Customers</h3>
        <button id="add-customer-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Add Customer
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No customers yet. Add your first customer!</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id}>
                  <td className="td-muted">{i + 1}</td>
                  <td><strong>{c.full_name}</strong></td>
                  <td className="td-muted">{c.email}</td>
                  <td className="td-muted">{c.phone_number}</td>
                  <td className="td-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button id={`delete-customer-${c.id}`} className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(c)}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddCustomerModal
          onClose={() => setShowModal(false)}
          onSaved={fetchCustomers}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          customerName={deleteTarget.full_name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
