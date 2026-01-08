import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/notifications?limit=10&unread_only=false', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:5000/api/notifications/read/${notificationId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    !notification.is_read ? 'bg-slate-800/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-slate-100">
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{notification.symbol && `${notification.symbol} • `}{formatTime(notification.created_at)}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      notification.type === 'price_alert' ? 'bg-green-500/20 text-green-400' :
                      notification.type === 'ai_signal' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {notification.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => window.location.href = '/notifications'}
              className="w-full text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
