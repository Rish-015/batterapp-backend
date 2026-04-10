import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, X, Loader2, Edit, Trash2, Phone } from 'lucide-react';
import { partnerService, zoneService } from '../services/api';
import './TablePage.css';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle_number: '', zone_id: '', is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
    fetchZones();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await partnerService.getAll();
      setPartners(response.data);
    } catch (error) {
      console.error("Failed to fetch partners", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await zoneService.getAll();
      setZones(response.data);
    } catch (error) {
      console.error("Failed to fetch zones", error);
    }
  };

  const openModal = (partner = null) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({ 
        name: partner.name, 
        phone: partner.phone, 
        vehicle_number: partner.vehicle_number, 
        zone_id: partner.zone_id?._id || '',
        is_active: partner.is_active 
      });
    } else {
      setEditingPartner(null);
      setFormData({ name: '', phone: '', vehicle_number: '', zone_id: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPartner) {
        await partnerService.update(editingPartner._id, formData);
      } else {
        await partnerService.create(formData);
      }
      setIsModalOpen(false);
      fetchPartners();
    } catch (error) {
      alert("Error saving partner: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Soft delete this partner?")) {
      try {
        await partnerService.delete(id);
        fetchPartners();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Loading partners...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search partners..." />
        </div>
        <div className="action-buttons">
          <button className="btn primary" onClick={() => openModal()}><Plus size={18} /> Add Partner</button>
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Contact</th>
              <th>Vehicle</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner._id}>
                <td>
                  <div className="flex-center gap-2">
                    <UserCheck size={16} className="text-primary" />
                    <strong>{partner.name}</strong>
                  </div>
                </td>
                <td>
                  <div className="flex-center gap-1 text-muted small">
                    <Phone size={12} />
                    {partner.phone}
                  </div>
                </td>
                <td>{partner.vehicle_number || 'N/A'}</td>
                <td>{partner.zone_id?.name || 'Unassigned'}</td>
                <td>
                  <span className={`status-badge ${partner.is_active ? 'active' : 'inactive'}`}>
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn-sm" onClick={() => openModal(partner)}><Edit size={16} /></button>
                    <button className="icon-btn-sm delete" onClick={() => handleDelete(partner._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPartner ? 'Edit Partner' : 'Add New Partner'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Full Name"
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="10 digit number"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input 
                    type="text" 
                    value={formData.vehicle_number} 
                    onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})} 
                    placeholder="KA-01-XX-XXXX"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Assigned Zone</label>
                <select 
                  value={formData.zone_id} 
                  onChange={(e) => setFormData({...formData, zone_id: e.target.value})} 
                  required
                >
                  <option value="">Select a Zone</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </select>
              </div>
              <div className="form-group flex-row gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="partner_active"
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                />
                <label htmlFor="partner_active" className="mb-0">Partner is active and available</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingPartner ? 'Update Partner' : 'Create Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
