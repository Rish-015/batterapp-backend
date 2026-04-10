import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, X, Loader2, Edit, Trash2 } from 'lucide-react';
import { zoneService } from '../services/api';
import './TablePage.css';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({ name: '', pincodes: '', isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await zoneService.getAll();
      setZones(response.data);
    } catch (error) {
      console.error("Failed to fetch zones", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({ 
        name: zone.name, 
        pincodes: zone.pincodes.join(', '), 
        isActive: zone.isActive !== false 
      });
    } else {
      setEditingZone(null);
      setFormData({ name: '', pincodes: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert comma-separated string to clean array of strings
    const pincodesArray = formData.pincodes
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (pincodesArray.length === 0) {
      alert("At least one pincode is required");
      setIsSubmitting(false);
      return;
    }

    const payload = { ...formData, pincodes: pincodesArray };

    try {
      if (editingZone) {
        await zoneService.update(editingZone._id, payload);
      } else {
        await zoneService.create(payload);
      }
      setIsModalOpen(false);
      fetchZones();
    } catch (error) {
      alert("Error saving zone: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this zone?")) {
      try {
        await zoneService.delete(id);
        fetchZones();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Loading zones...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search zones or pincodes..." />
        </div>
        <div className="action-buttons">
          <button className="btn primary" onClick={() => openModal()}><Plus size={18} /> Add Zone</button>
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Pincodes Covered</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone._id}>
                <td>
                  <div className="flex-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <strong>{zone.name}</strong>
                  </div>
                </td>
                <td>
                  <div className="pincode-tags">
                    {zone.pincodes?.map((p, i) => (
                      <span key={i} className="pincode-tag">{p}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${zone.isActive ? 'active' : 'inactive'}`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(zone.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn-sm" onClick={() => openModal(zone)}><Edit size={16} /></button>
                    <button className="icon-btn-sm delete" onClick={() => handleDelete(zone._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
               <tr><td colSpan="5" style={{textAlign:'center', padding:'50px'}}>No delivery zones found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingZone ? 'Edit Zone' : 'Add New Zone'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Zone Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. South Bangalore"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Pincodes (Comma separated)</label>
                <input 
                  type="text"
                  value={formData.pincodes} 
                  onChange={(e) => setFormData({...formData, pincodes: e.target.value})} 
                  placeholder="e.g. 560001, 560002, 560003"
                  required 
                />
                <span className="help-text">Enter multiple pincodes separated by commas</span>
              </div>
              <div className="form-group flex-row gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive} 
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                />
                <label htmlFor="isActive" className="mb-0">Zone is active for delivery</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingZone ? 'Update Zone' : 'Save Zone')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zones;
