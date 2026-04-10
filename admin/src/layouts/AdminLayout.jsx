import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  MapPin, 
  Clock, 
  Users, 
  Search, 
  Bell, 
  Menu,
  ChevronRight,
  ChevronDown,
  Lock,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const pageTitle = location.pathname === '/' 
    ? 'Dashboard' 
    : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
    { name: 'Zones', path: '/zones', icon: <MapPin size={20} /> },
    { name: 'Slots (Master)', path: '/slots', icon: <Clock size={20} /> },
    { name: 'Daily Slots', path: '/daily-slots', icon: <Clock size={20} /> },
    { name: 'Partners', path: '/partners', icon: <Users size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Stock', path: '/stock', icon: <Package size={20} /> },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">B</div>
          <span>Batter Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              {item.icon}
              <span>{item.name}</span>
              {location.pathname === item.path && <ChevronRight size={16} className="active-arrow" />}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">{pageTitle}</h1>
          </div>
          
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search anything..." />
            </div>
            
            <button className="icon-btn">
              <Bell size={20} />
              <span className="badge"></span>
            </button>
            
            <div className="header-divider"></div>
            
            <div className="profile-wrapper">
              <button 
                className="profile-trigger" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="avatar">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD'}
                </div>
                <div className="profile-info">
                  <span className="name">{user?.name || 'Super Admin'}</span>
                  <span className="role">Administrative Privileges</span>
                  <ChevronDown size={12} className={`chevron-abs ${isProfileOpen ? 'rotate' : ''}`} />
                </div>
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="d-name">{user?.name || 'Super Admin'}</p>
                    <p className="d-email">{user?.email || 'admin@batternapp.com'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => {
                    setIsChangePasswordOpen(true);
                    setIsProfileOpen(false);
                  }}>
                    <Lock size={16} />
                    <span>Change Password</span>
                  </button>
                  <button className="dropdown-item logout" onClick={logout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </div>
  );
};

export default AdminLayout;
