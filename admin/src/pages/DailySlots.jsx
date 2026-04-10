import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { zoneService, slotService, slotAvailabilityService } from '../services/api';
import './TablePage.css';
import './DailySlots.css';

const DailySlots = () => {
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState({}); // { "zoneId-slotId": { max_orders, isActive } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesRes, slotsRes, availRes] = await Promise.all([
        zoneService.getAll(),
        slotService.getAll(),
        slotAvailabilityService.getAllForDate(selectedDate)
      ]);

      const activeZones = zonesRes.data.filter(z => z.isActive);
      const activeSlots = slotsRes.data.filter(s => s.is_active);
      
      setZones(activeZones);
      setSlots(activeSlots);

      // Map existing records
      const availMap = {};
      
      // Initialize with defaults from master slots
      activeZones.forEach(z => {
        activeSlots.forEach(s => {
          availMap[`${z._id}-${s._id}`] = {
            max_orders: s.total_orders || 50,
            isActive: false // Default to closed unless record exists
          };
        });
      });

      // Update with real data from DB
      availRes.data.forEach(record => {
        const key = `${record.zone_id._id || record.zone_id}-${record.slot_id._id || record.slot_id}`;
        if (availMap[key]) {
          availMap[key] = {
            max_orders: record.max_orders,
            isActive: record.available_orders > 0 || record.max_orders > 0 // Heuristic for "open"
            // Note: In our system, the existence of a record usually implies it's "intended" to be open.
            // If available_orders is 0 but max_orders is > 0, it means it's FULL.
            // If we want a specific toggle, we might need a field in SlotAvailability.
            // For now, we'll assume isActive = true if a record exists.
          };
          availMap[key].isActive = true; 
        }
      });

      setAvailability(availMap);
    } catch (error) {
      console.error("Failed to load daily slots", error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (zoneId, slotId) => {
    const key = `${zoneId}-${slotId}`;
    setAvailability({
      ...availability,
      [key]: {
        ...availability[key],
        isActive: !availability[key].isActive
      }
    });
  };

  const handleCapacityChange = (zoneId, slotId, value) => {
    const key = `${zoneId}-${slotId}`;
    setAvailability({
      ...availability,
      [key]: {
        ...availability[key],
        max_orders: parseInt(value) || 0
      }
    });
  };

  const handleBulkSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = [];
      Object.entries(availability).forEach(([key, data]) => {
        if (data.isActive) {
          const [zone_id, slot_id] = key.split('-');
          updates.push({
            zone_id,
            slot_id,
            date: selectedDate,
            max_orders: data.max_orders,
            available_orders: data.max_orders // Reset availability on bulk open/save
          });
        }
        // Note: Currently we don't 'delete' records if toggled off, 
        // we just don't create/update them. The user app only fetches records for a day.
      });

      if (updates.length > 0) {
        await slotAvailabilityService.bulkUpdate(updates);
        setMessage({ type: 'success', text: `Slots opened/updated for ${selectedDate}` });
      } else {
        setMessage({ type: 'info', text: 'No active slots selected to save.' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save updates' });
    } finally {
      setSaving(false);
    }
  };

  const adjustDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Fetching availability grid...</div>;

  return (
    <div className="table-page">
      <div className="stock-header">
        <div className="date-controls">
          <button className="btn outline icon-only" onClick={() => adjustDate(-1)}><ChevronLeft size={20} /></button>
          <div className="date-picker-wrapper">
            <Calendar size={18} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button className="btn outline icon-only" onClick={() => adjustDate(1)}><ChevronRight size={20} /></button>
        </div>

        <button className="btn primary" onClick={handleBulkSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Save Availability
        </button>
      </div>

      {message && (
        <div className={`stock-message ${message.type || 'success'}`}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid-container">
        <table className="availability-grid">
          <thead>
            <tr>
              <th className="sticky-col">Delivery Zone</th>
              {slots.map(slot => (
                <th key={slot._id}>
                  <div className="slot-header-cell">
                    <span className="slot-name">{slot.name}</span>
                    <span className="slot-time">{slot.start_time}-{slot.end_time}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map(zone => (
              <tr key={zone._id}>
                <td className="sticky-col zone-name-cell">
                  <strong>{zone.name}</strong>
                </td>
                {slots.map(slot => {
                  const key = `${zone._id}-${slot._id}`;
                  const data = availability[key] || { isActive: false, max_orders: 50 };
                  return (
                    <td key={slot._id} className={data.isActive ? 'slot-cell active' : 'slot-cell'}>
                      <div className="slot-control">
                        <button 
                          className={`toggle-btn ${data.isActive ? 'on' : 'off'}`}
                          onClick={() => toggleSlot(zone._id, slot._id)}
                        >
                          {data.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          <span>{data.isActive ? 'Open' : 'Closed'}</span>
                        </button>
                        
                        {data.isActive && (
                          <div className="cap-input">
                             <label>Limit:</label>
                             <input 
                                type="number" 
                                value={data.max_orders} 
                                onChange={(e) => handleCapacityChange(zone._id, slot._id, e.target.value)}
                             />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="stock-footer">
        <p className="help-text">
          <AlertCircle size={14} style={{ marginRight: 4 }} />
          Slots must be "Opened" individually for each zone/date to be available for orders.
          "Save" will reset the available count to the limit for the selected date.
        </p>
      </div>
    </div>
  );
};

export default DailySlots;
