import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, X, Upload, Loader2, Trash2, Edit } from 'lucide-react';
import { productService } from '../services/api';
import './TablePage.css';
import './Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', weight: '', is_active: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, weight: product.weight, is_active: product.is_active });
      setImagePreview(product.image_url);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', weight: '', is_active: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('weight', formData.weight);
    data.append('is_active', formData.is_active);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingProduct) {
        await productService.update(editingProduct._id, data);
      } else {
        await productService.create(data);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      alert("Error saving product: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.delete(id);
        fetchProducts();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Fetching inventory...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search products..." />
        </div>
        <div className="action-buttons">
          <button className="btn primary" onClick={() => openModal()}><Plus size={18} /> Add Product</button>
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <img src={product.image_url} alt={product.name} className="product-thumb" />
                </td>
                <td><strong>{product.name}</strong></td>
                <td>₹{product.price}</td>
                <td>{product.weight}</td>
                <td>
                  <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn-sm" onClick={() => openModal(product)}><Edit size={16} /></button>
                    <button className="icon-btn-sm delete" onClick={() => handleDelete(product._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content product-modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="image-upload-section">
                <div className="image-preview-container">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="preview-img" />
                  ) : (
                    <div className="image-placeholder">
                      <Upload size={32} />
                      <span>Upload Product Image</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} id="product-image" hidden />
                <label htmlFor="product-image" className="btn outline">Choose Image</label>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (e.g. 1kg)</label>
                    <input 
                      type="text" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group checkbox">
                   <input 
                    type="checkbox" 
                    id="is_active"
                    checked={formData.is_active} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                  />
                  <label htmlFor="is_active">Product is active and visible to customers</label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
