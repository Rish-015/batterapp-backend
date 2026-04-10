import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiry or unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) => api.post('/auth/login-admin', { username, password }),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword }),
};

export const dashboardService = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Aggregated call or individual calls
    const [ordersRes, productsRes, usersRes, partnersRes, todayStockRes, todaySlotsRes] = await Promise.all([
      api.get('/orders/admin/all'),
      api.get('/products/admin/all'),
      api.get('/users/admin/all'),
      api.get('/delivery-partners'),
      api.get(`/stock?date=${today}`),
      api.get(`/slot-availability/admin/all?date=${today}`)
    ]);
    
    const orders = ordersRes.data;
    const todayOrders = orders.filter(o => o.delivery_date === today);
    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
    
    return {
      revenue: `₹${totalRevenue.toLocaleString()}`,
      orders: orders.length,
      partners: partnersRes.data.length,
      customers: usersRes.data.length,
      recentOrders: orders.slice(0, 5),
      today: {
        orderCount: todayOrders.length,
        stockEntries: todayStockRes.data.length,
        openSlots: todaySlotsRes.data.filter(s => s.available_orders > 0).length,
        stockDetails: todayStockRes.data.map(s => ({
            name: s.product_id?.name || 'Unknown',
            qty: s.available_quantity
        }))
      }
    };
  }
};

export const orderService = {
  getAll: (params) => api.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  assignPartner: (id, partnerId) => api.patch(`/orders/${id}/assign`, { partnerId }),
};

export const productService = {
  getAll: () => api.get('/products/admin/all'),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id, enable) => api.patch(`/products/${id}/${enable ? 'enable' : 'disable'}`),
};

export const zoneService = {
  getAll: () => api.get('/zones'),
  create: (data) => api.post('/zones', data),
  update: (id, data) => api.put(`/zones/${id}`, data),
  delete: (id) => api.delete(`/zones/${id}`),
};

export const slotService = {
  getAll: () => api.get('/slots/admin/all'),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
};

export const partnerService = {
  getAll: () => api.get('/delivery-partners'),
  create: (data) => api.post('/delivery-partners', data),
  update: (id, data) => api.put(`/delivery-partners/${id}`, data),
  delete: (id) => api.delete(`/delivery-partners/${id}`),
};

export const userService = {
  getAll: () => api.get('/users/admin/all'),
};

export const stockService = {
  getAll: () => api.get('/stock/all'),
  getByDate: (date) => api.get(`/stock?date=${date}`),
  update: (data) => api.post('/stock', data), // Upsert stock for product/date
  delete: (id) => api.delete(`/stock/${id}`),
};

export const slotAvailabilityService = {
  getAllForDate: (date) => api.get(`/slot-availability/admin/all?date=${date}`),
  bulkUpdate: (updates) => api.post('/slot-availability/bulk-update', { updates }),
};

export default api;
