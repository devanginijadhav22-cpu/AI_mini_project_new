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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Notification Center</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Alerts on eligibility updates, application review statuses, and deadlines</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-zinc-200"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'ALL' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'UNREAD' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Unread ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setFilter('APPLICATIONS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'APPLICATIONS' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Applications
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-zinc-500 space-y-2 rounded-xl border border-zinc-200/80">
          <Bell className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="font-medium text-zinc-800 text-sm">No notifications found.</p>
          <p>You're completely caught up with all updates.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                !item.is_read ? 'border-zinc-300 bg-zinc-50/40' : 'border-zinc-200/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-zinc-200">
                  <Bell className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900">{item.title}</h4>
                    {!item.is_read && (
                      <span className="text-[9px] font-medium uppercase tracking-wider bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-zinc-400 block pt-0.5 font-mono">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkRead(item.id)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
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

