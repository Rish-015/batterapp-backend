import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Zones from './pages/Zones';
import Slots from './pages/Slots';
import Partners from './pages/Partners';
import Customers from './pages/Customers';
import Stock from './pages/Stock';
import DailySlots from './pages/DailySlots';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="zones" element={<Zones />} />
            <Route path="slots" element={<Slots />} />
            <Route path="partners" element={<Partners />} />
            <Route path="customers" element={<Customers />} />
            <Route path="stock" element={<Stock />} />
            <Route path="daily-slots" element={<DailySlots />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
