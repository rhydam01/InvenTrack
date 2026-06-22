import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api'

const EMPTY_FORM = { name: '', sku: '', price: '', quantity_in_stock: '' }

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Product name is required.'
  if (!form.sku.trim())  errors.sku  = 'SKU is required.'
  const price = parseFloat(form.price)
  if (!form.price || isNaN(price) || price <= 0) errors.price = 'Price must be a positive number.'
  const qty = parseInt(form.quantity_in_stock, 10)
  if (form.quantity_in_stock === '' || isNaN(qty) || qty < 0) errors.quantity_in_stock = 'Quantity must be 0 or greater.'
  return errors
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState(
    isEdit
      ? { name: product.name, sku: product.sku, price: String(product.price), quantity_in_stock: String(product.quantity_in_stock) }
      : EMPTY_FORM
  )
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
      const payload = {
        name: form.name.trim(),
        sku:  form.sku.trim(),
        price: parseFloat(form.price),
        quantity_in_stock: parseInt(form.quantity_in_stock, 10),
      }
      if (isEdit) {
        await updateProduct(product.id, payload)
        toast.success('Product updated successfully!')
      } else {
        await createProduct(payload)
        toast.success('Product added successfully!')
      }
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
          <h3>{isEdit ? '✏️ Edit Product' : '➕ Add Product'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="prod-name">Product Name *</label>
              <input id="prod-name" name="name" className={`form-control${errors.name ? ' error' : ''}`} value={form.name} onChange={handleChange} placeholder="e.g. Wireless Keyboard" />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="prod-sku">SKU *</label>
              <input id="prod-sku" name="sku" className={`form-control${errors.sku ? ' error' : ''}`} value={form.sku} onChange={handleChange} placeholder="e.g. WK-001" />
              {errors.sku && <div className="field-error">{errors.sku}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="prod-price">Price ($) *</label>
              <input id="prod-price" name="price" type="number" min="0.01" step="0.01" className={`form-control${errors.price ? ' error' : ''}`} value={form.price} onChange={handleChange} placeholder="e.g. 29.99" />
              {errors.price && <div className="field-error">{errors.price}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="prod-qty">Quantity in Stock *</label>
              <input id="prod-qty" name="quantity_in_stock" type="number" min="0" step="1" className={`form-control${errors.quantity_in_stock ? ' error' : ''}`} value={form.quantity_in_stock} onChange={handleChange} placeholder="e.g. 100" />
              {errors.quantity_in_stock && <div className="field-error">{errors.quantity_in_stock}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ productName, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>🗑️ Delete Product</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{productName}</strong>? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = () => {
    setLoading(true)
    getProducts()
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
      fetchProducts()
    } catch {
      toast.error('Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="section-header mb-6">
        <h3>All Products</h3>
        <button id="add-product-btn" className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true) }}>
          ➕ Add Product
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📦</div>
            <p>No products yet. Add your first product!</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>In Stock</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id}>
                  <td className="td-muted">{i + 1}</td>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="badge badge-info font-mono">{p.sku}</span></td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.quantity_in_stock === 0 ? 'badge-danger' : p.quantity_in_stock < 10 ? 'badge-warning' : 'badge-success'}`}>
                      {p.quantity_in_stock}
                    </span>
                  </td>
                  <td className="td-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button id={`edit-product-${p.id}`} className="btn btn-sm btn-warning" onClick={() => { setEditProduct(p); setShowModal(true) }}>✏️ Edit</button>
                      <button id={`delete-product-${p.id}`} className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null) }}
          onSaved={fetchProducts}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
