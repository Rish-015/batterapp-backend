import React, { useState, useEffect } from 'react';
import { Search, Plus, Clock, X, Loader2, Edit, Trash2 } from 'lucide-react';
import { slotService } from '../services/api';
import './TablePage.css';

const Slots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({ name: '', start_time: '', end_time: '', total_orders: 50, is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await slotService.getAll();
      setSlots(response.data);
    } catch (error) {
      console.error("Failed to fetch slots", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({ 
        name: slot.name, 
        start_time: slot.start_time, 
        end_time: slot.end_time, 
        total_orders: slot.total_orders,
        is_active: slot.is_active 
      });
    } else {
      setEditingSlot(null);
      setFormData({ name: '', start_time: '', end_time: '', total_orders: 50, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSlot) {
        await slotService.update(editingSlot._id, formData);
      } else {
        await slotService.create(formData);
      }
      setIsModalOpen(false);
      fetchSlots();
    } catch (error) {
      alert("Error saving slot: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this slot?")) {
      try {
        await slotService.delete(id);
        fetchSlots();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Loading slots...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search slots..." />
        </div>
        <div className="action-buttons">
          <button className="btn primary" onClick={() => openModal()}><Plus size={18} /> Add Slot</button>
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Slot Name</th>
              <th>Time Range</th>
              <th>Order Cap</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot._id}>
                <td>
                  <div className="flex-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <strong>{slot.name}</strong>
                  </div>
                </td>
                <td>{slot.start_time} - {slot.end_time}</td>
                <td>{slot.total_orders} orders / zone</td>
                <td>
                  <span className={`status-badge ${slot.is_active ? 'active' : 'inactive'}`}>
                    {slot.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn-sm" onClick={() => openModal(slot)}><Edit size={16} /></button>
                    <button className="icon-btn-sm delete" onClick={() => handleDelete(slot._id)}><Trash2 size={16} /></button>
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
              <h3>{editingSlot ? 'Edit Slot' : 'Add New Slot'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Slot Label</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Early Morning"
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time (24h)</label>
                  <input 
                    type="text" 
                    value={formData.start_time} 
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
                    placeholder="06:00"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>End Time (24h)</label>
                  <input 
                    type="text" 
                    value={formData.end_time} 
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
                    placeholder="09:00"
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Total Orders Limit</label>
                <input 
                  type="number" 
                  value={formData.total_orders} 
                  onChange={(e) => setFormData({...formData, total_orders: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group flex-row gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="slot_active"
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                />
                <label htmlFor="slot_active" className="mb-0">Slot is active for new orders</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editingSlot ? 'Update Slot' : 'Create Slot')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slots;
