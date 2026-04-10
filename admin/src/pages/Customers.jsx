import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, User, Phone, Mail, Calendar } from 'lucide-react';
import { userService } from '../services/api';
import './TablePage.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await userService.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="animate-spin" /> Fetching customer records...</div>;

  return (
    <div className="table-page">
      <div className="table-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by name, email or phone..." />
        </div>
      </div>

      <div className="table-container">
        <table className="main-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact Info</th>
              <th>Default address</th>
              <th>Joined On</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id}>
                <td>
                  <div className="user-profile-td">
                    <div className="avatar-sm">{customer.name?.[0] || 'U'}</div>
                    <strong>{customer.name || 'N/A'}</strong>
                  </div>
                </td>
                <td>
                  <div className="contact-info-td">
                    <p className="flex-center gap-1"><Mail size={12} /> {customer.email || 'No Email'}</p>
                    <p className="flex-center gap-1"><Phone size={12} /> {customer.phone || 'No Phone'}</p>
                  </div>
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <div className="flex-start gap-1">
                    <MapPin size={16} className="text-muted mt-1" />
                    <span className="small">
                      {customer.addresses?.find(a => a.is_default)?.address_text || 
                       customer.addresses?.[0]?.address_text || 
                       'No address added'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex-center gap-1 text-muted small">
                    <Calendar size={12} />
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="4" style={{textAlign:'center', padding:'50px'}}>No customers registered yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="pagination">
        <p>Total Registered Customers: {customers.length}</p>
      </div>
    </div>
  );
};

export default Customers;
