import React, { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService, stockService } from '../services/api';
import './TablePage.css';
import './Stock.css';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState({}); // { productId: quantity }
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
      const [prodRes, stockRes] = await Promise.all([
        productService.getAll(),
        stockService.getByDate(selectedDate)
      ]);

      const prodData = prodRes.data.filter(p => p.is_active);
      setProducts(prodData);

      // Create a map of existing stock
      const stockMap = {};
      stockRes.data.forEach(item => {
        stockMap[item.product_id._id || item.product_id] = item.available_quantity;
      });
      
      // For products without stock entry, default to 0
      prodData.forEach(p => {
        if (stockMap[p._id] === undefined) {
          stockMap[p._id] = 0;
        }
      });
      
      setStocks(stockMap);
    } catch (error) {
      console.error("Failed to load stock data", error);
      setMessage({ type: 'error', text: 'Failed to load stock data' });
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (productId, value) => {
    setStocks({
      ...stocks,
      [productId]: parseInt(value) || 0
    });
  };

  const handleBulkSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updatePromises = Object.entries(stocks).map(([productId, quantity]) => {
        return stockService.update({
          product_id: productId,
          date: selectedDate,
          available_quantity: quantity
        });
      });

      await Promise.all(updatePromises);
      setMessage({ type: 'success', text: `Stock updated for ${selectedDate}!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Bulk save failed", error);
      setMessage({ type: 'error', text: 'Some updates failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const adjustDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Preparing stock sheet...</div>;

  return (
    <div className="table-page">
      <div className="stock-header">
        <div className="date-controls">
          <button className="btn outline icon-only" onClick={() => adjustDate(-1)} title="Previous Day">
            <ChevronLeft size={20} />
          </button>
          <div className="date-picker-wrapper">
            <Calendar size={18} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button className="btn outline icon-only" onClick={() => adjustDate(1)} title="Next Day">
            <ChevronRight size={20} />
          </button>
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <span className="today-badge">Today</span>
          )}
        </div>

        <button 
          className="btn primary" 
          onClick={handleBulkSave}
          disabled={saving || products.length === 0}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Save All Changes
        </button>
      </div>

      {message && (
        <div className={`stock-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Weight</th>
              <th>Current Price</th>
              <th style={{ width: '200px' }}>Available Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <img src={product.image_url} alt={product.name} className="product-thumb" />
                </td>
                <td>
                    <strong>{product.name}</strong>
                    <div className="small text-muted">{product.is_active ? 'Active' : 'Inactive'}</div>
                </td>
                <td>{product.weight}</td>
                <td>₹{product.price}</td>
                <td>
                  <div className="stock-input-wrapper">
                     <input 
                        type="number" 
                        min="0"
                        className="stock-input"
                        value={stocks[product._id] || 0}
                        onChange={(e) => handleStockChange(product._id, e.target.value)}
                     />
                     <span className="unit">units</span>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  No active products found to manage stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="stock-footer">
        <p className="help-text">
          <AlertCircle size={14} style={{ marginRight: 4 }} />
          Stock updates are per-day. Selecting a different date will show the stock sheet for that day.
        </p>
      </div>
    </div>
  );
};

export default Stock;
