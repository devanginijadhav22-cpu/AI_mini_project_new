import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { 
  GraduationCap, Bell, User as UserIcon, LogOut, CheckCircle2, 
  ChevronDown, ShieldCheck, Sparkles, AlertCircle 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking notifications read", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight font-sans flex items-center gap-1.5">
                ScholarAI
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Expert System
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Scholarship Decision Engine</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/' ? 'text-brand-600 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/student/scholarships" 
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname.includes('/scholarships') ? 'text-brand-600 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Explore Scholarships
            </Link>
            {user?.role === 'STUDENT' && (
              <Link 
                to="/student/dashboard" 
                className={`px-3 py-2 rounded-lg transition-colors ${
                  location.pathname.includes('/student/dashboard') ? 'text-brand-600 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Dashboard
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin/dashboard" 
                className={`px-3 py-2 rounded-lg transition-colors ${
                  location.pathname.includes('/admin') ? 'text-brand-600 bg-brand-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Admin Console
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-brand-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h4>
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 transition ${!n.is_read ? 'bg-brand-50/40' : ''}`}>
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-semibold text-slate-900">{n.title}</span>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-600 mt-1 flex-shrink-0"></span>}
                              </div>
                              <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                        <Link 
                          to="/student/notifications" 
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                        >
                          View all notification history
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info Chip */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">{user.full_name}</p>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user.role}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Student Login
                </Link>
                <Link
                  to="/admin-login"
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
