import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Package, Plus, Trash2, Edit, TrendingUp, ShoppingCart, Upload, ImageIcon, X } from 'lucide-react';

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, sold: 0, ordersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMyProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };


  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/seller/orders');
      const ordersData = res.data.data || res.data || [];
      setOrders(ordersData);
      
      let revenue = 0;
      let sold = 0;
      ordersData.forEach(o => {
        o.items?.forEach(i => {
          if (i.itemStatus !== 'CANCELLED') {
            revenue += i.subtotal || 0;
            sold += i.quantity || 0;
          }
        });
      });
      setStats({ revenue, sold, ordersCount: ordersData.length });
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchMyProducts(), fetchMyOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/upload/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
        setImagePreview(res.data.imageUrl);
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10)
      };
      if (editingId) {
        await api.put(`/seller/products/${editingId}`, payload);
      } else {
        await api.post('/seller/products', payload);
      }
      setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
      setImagePreview('');
      setEditingId(null);
      fetchMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      imageUrl: product.imageUrl || ''
    });
    setImagePreview(product.imageUrl || '');
    setEditingId(product.id);
    setActiveTab('products');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/seller/products/${id}`);
        fetchMyProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const statusColors = {
    PLACED: { bg: 'rgba(79, 70, 229, 0.15)', color: '#a5b4fc', label: 'Placed' },
    SHIPPING: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', label: 'Shipping' },
    DELIVERED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', label: 'Delivered' },
    CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', label: 'Cancelled' },
  };

  return (
    <div className="page-container container">
      <h1 style={{fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
        <Package /> Seller Dashboard
      </h1>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }}>
            <TrendingUp size={24} color="var(--primary)" />
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>Total Revenue</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>${stats.revenue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }}>
            <Package size={24} color="var(--primary)" />
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>Products Sold</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats.sold}</h3>
          </div>
        </div>
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%' }}>
            <ShoppingCart size={24} color="var(--primary)" />
          </div>
          <div>
            <p style={{ margin: 0, opacity: 0.8 }}>Total Orders</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats.ordersCount}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('orders')}
          style={{ background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', border: activeTab === 'orders' ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
        >
          Manage Orders
        </button>
        <button 
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('products')}
          style={{ background: activeTab === 'products' ? 'var(--primary)' : 'transparent', border: activeTab === 'products' ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
        >
          Manage Products
        </button>
      </div>

      {loading ? <p>Loading dashboard data...</p> : (
        <>
          {activeTab === 'orders' && (
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Orders</h2>
              {orders.length === 0 ? <p>No orders found.</p> : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order =>
                        order.items?.map(item => (
                          <tr key={item.itemId}>
                            <td>#{order.orderId}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '500' }}>{item.productName}</td>
                            <td>x{item.quantity}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${item.subtotal?.toFixed(2)}</td>
                            <td>
                              {(() => {
                                const s = item.itemStatus || 'PLACED';
                                const style = statusColors[s] || statusColors.PLACED;
                                return (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.04em',
                                    background: style.bg,
                                    color: style.color,
                                    border: `1px solid ${style.color}33`,
                                  }}>
                                    {style.label}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
              <div style={{flex: '1 1 400px'}}>
                <div className="card glass" style={{padding: '2rem'}}>
                  <h2 style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">Product Name</label>
                      <input type="text" name="name" required className="form-input" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea name="description" required className="form-input" rows="3" value={formData.description} onChange={handleChange}></textarea>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Price ($)</label>
                        <input type="number" step="0.01" name="price" required className="form-input" value={formData.price} onChange={handleChange} />
                      </div>
                      <div className="form-group" style={{flex: 1}}>
                        <label className="form-label">Stock</label>
                        <input type="number" name="stock" required className="form-input" value={formData.stock} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <input type="text" name="category" required className="form-input" value={formData.category} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Product Image</label>

                      {/* Drop Zone / Preview */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !imagePreview && fileInputRef.current?.click()}
                        style={{
                          border: `2px dashed ${dragOver ? 'var(--primary)' : imagePreview ? 'var(--secondary)' : 'rgba(255,255,255,0.15)'}`,
                          borderRadius: '0.75rem',
                          background: dragOver ? 'rgba(79,70,229,0.08)' : imagePreview ? 'transparent' : 'rgba(255,255,255,0.03)',
                          minHeight: '160px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: imagePreview ? 'default' : 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {imagePreview ? (
                          <>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '0.65rem' }}
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); clearImage(); }}
                              style={{
                                position: 'absolute', top: '8px', right: '8px',
                                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#fff',
                              }}
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              style={{
                                position: 'absolute', bottom: '8px', right: '8px',
                                background: 'rgba(79,70,229,0.85)', border: 'none', borderRadius: '6px',
                                padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '4px',
                              }}
                            >
                              <Upload size={12} /> Change
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                            {uploadingImage ? (
                              <>
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Uploading…</div>
                                <div style={{
                                  height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', width: '120px', margin: '0 auto'
                                }}>
                                  <div style={{ height: '100%', background: 'var(--primary)', animation: 'slideIn 1s ease infinite', width: '60%' }} />
                                </div>
                              </>
                            ) : (
                              <>
                                <ImageIcon size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Drop image here or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>browse</span></p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>PNG, JPG, WEBP up to 10MB</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={uploadingImage}>
                      {editingId ? <><Edit size={16}/> Update Product</> : <><Plus size={16}/> Add Product</>}
                    </button>
                    {editingId && (
                      <button type="button" onClick={() => {setEditingId(null); setImagePreview(''); setFormData({name: '', description: '', price: '', category: '', stock: '', imageUrl: ''});}} className="btn btn-secondary" style={{width: '100%', marginTop: '0.5rem'}}>
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </div>
              </div>
              
              <div style={{flex: '2 1 600px'}}>
                <div className="card glass" style={{padding: '1rem'}}>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p.id}>
                              <td>{p.name}</td>
                              <td>{p.category}</td>
                              <td>${p.price?.toFixed(2)}</td>
                              <td>{p.stock}</td>
                              <td>
                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                  <button onClick={() => handleEdit(p)} className="btn btn-secondary" style={{padding: '0.25rem', border: 'none', color: 'var(--primary)'}}>
                                    <Edit size={18} />
                                  </button>
                                  <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{padding: '0.25rem', border: 'none', color: 'var(--danger)'}}>
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerDashboard;
