import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  AlertTriangle,
  Package
} from 'lucide-react';
import { dashboardService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-state">
      <Loader2 className="animate-spin" size={40} />
      <p>Fetching real-time metrics...</p>
    </div>
  );

  const statCards = [
    { name: 'Total Revenue', value: stats.revenue, icon: <DollarSign size={24} />, change: '+12.5%', isPositive: true },
    { name: 'Total Orders', value: stats.orders, icon: <ShoppingBag size={24} />, change: '+8.2%', isPositive: true },
    { name: 'Total Partners', value: stats.partners, icon: <Users size={24} />, change: '-2.4%', isPositive: false },
    { name: 'Total Customers', value: stats.customers, icon: <TrendingUp size={24} />, change: '+4.1%', isPositive: true },
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <p className="stat-name">{stat.name}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <div className={`stat-change ${stat.isPositive ? 'positive' : 'negative'}`}>
                {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{stat.change}</span>
                <span className="since">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Operations Section */}
      <div className="section-header">
        <h2 className="section-title">Today's Operations</h2>
        <span className="date-tag">{new Date().toDateString()}</span>
      </div>

      <div className="today-grid">
        <div className="today-card">
            <div className="today-icon orders"><ShoppingBag size={20} /></div>
            <div className="today-data">
                <h4>{stats.today.orderCount}</h4>
                <p>Orders to deliver today</p>
            </div>
        </div>
        <div className="today-card">
            <div className="today-icon slots"><Calendar size={20} /></div>
            <div className="today-data">
                <h4>{stats.today.openSlots}</h4>
                <p>Active booking slots</p>
            </div>
        </div>
        <div className="today-card">
            <div className="today-icon stock"><Package size={20} /></div>
            <div className="today-data">
                <h4>{stats.today.stockEntries}</h4>
                <p>Products in stock</p>
            </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="table-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="text-btn" onClick={() => window.location.href='/orders'}>View All</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order, index) => (
                <tr key={index}>
                  <td><span className="order-id">#{order._id.substring(order._id.length - 8).toUpperCase()}</span></td>
                  <td>{order.user_id?.name || 'Guest'}</td>
                  <td>{order.items?.[0]?.name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="amount-cell">₹{order.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="side-card">
          <div className="card-header">
            <h3>Today's Stock Level</h3>
            <button className="text-btn" onClick={() => window.location.href='/stock'}>Manage</button>
          </div>
          <div className="stock-list">
            {stats.today.stockDetails.map((item, idx) => (
                <div key={idx} className="stock-item">
                    <div className="s-info">
                        <span className="s-name">{item.name}</span>
                        <div className="s-bar-bg">
                            <div 
                                className={`s-bar-fill ${item.qty < 10 ? 'low' : ''}`} 
                                style={{ width: `${Math.min(100, item.qty)}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className={`s-qty ${item.qty < 10 ? 'danger' : ''}`}>{item.qty} units</span>
                </div>
            ))}
            {stats.today.stockDetails.length === 0 && (
                <div className="empty-stock">
                    <AlertTriangle size={32} />
                    <p>No stock defined for today!</p>
                    <button className="btn outline sm" onClick={() => window.location.href='/stock'}>Set Stock</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
