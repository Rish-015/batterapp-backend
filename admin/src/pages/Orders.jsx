import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, Loader2, RefreshCw } from 'lucide-react';
import { orderService, partnerService } from '../services/api';
import './TablePage.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchPartners();

    // Auto refresh every 60s
    const interval = setInterval(() => {
      refreshData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await partnerService.getAll();
      setPartners(response.data);
    } catch (error) {
      console.error("Failed to fetch partners", error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      fetchOrders(); // Refresh
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleAssignPartner = async (orderId, partnerId) => {
    if (!partnerId) return;
    try {
      await orderService.assignPartner(orderId, partnerId);
      fetchOrders();
    } catch (error) {
      alert("Failed to assign partner");
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Fetching orders...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by Order ID or Customer..." />
        </div>
        <div className="action-buttons">
          <button className="btn outline" onClick={refreshData}>
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} /> 
            Refresh
          </button>
          <button className="btn outline"><Download size={18} /> Export</button>
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product & Qty</th>
              <th>Status</th>
              <th>Partner</th>
              <th>Bill Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td><strong>#{order._id.substring(order._id.length - 8).toUpperCase()}</strong></td>
                <td>
                  <div className="user-info-td">
                    <p className="u-name">{order.user_id?.name || 'Guest'}</p>
                    <p className="u-phone">{order.user_id?.phone}</p>
                  </div>
                </td>
                <td>
                  {order.items?.map((item, i) => (
                    <div key={i}>{item.name} x {item.quantity}</div>
                  ))}
                </td>
                <td>
                  <select 
                    className={`status-select ${order.status.toLowerCase()}`}
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td>
                  <select 
                    className="partner-select"
                    value={order.delivery_partner_id?._id || ''}
                    onChange={(e) => handleAssignPartner(order._id, e.target.value)}
                  >
                    <option value="">Assign Partner</option>
                    {partners.filter(p => !order.zone_id || p.zone_id?._id === order.zone_id?._id).map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td>₹{order.total_price}</td>
                <td><button className="icon-btn-sm"><MoreVertical size={16} /></button></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="7" style={{textAlign:'center', padding:'50px'}}>No orders active in DB</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="pagination">
        <p>Total Orders: {orders.length}</p>
      </div>
    </div>
  );
};

export default Orders;
