import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, CheckCircle2, Clock, Info, Check, Filter } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all read", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, is_read: true }) : n));
    } catch (err) {
      console.error("Error marking read", err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'APPLICATIONS') return n.type === 'APPLICATION' || n.title.includes('Application');
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-500">Real-time alerts on eligibility updates, application reviews, and deadlines</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'ALL' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'UNREAD' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setFilter('APPLICATIONS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'APPLICATIONS' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Applications
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-soft p-12 text-center text-xs text-slate-500 space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No notifications found.</p>
          <p>You're completely caught up with all updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`card-soft p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                !item.is_read ? 'bg-brand-50/30 border-brand-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                  item.type === 'APPLICATION' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-brand-100 text-brand-600'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    {!item.is_read && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-brand-600 text-white px-1.5 py-0.2 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkRead(item.id)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
