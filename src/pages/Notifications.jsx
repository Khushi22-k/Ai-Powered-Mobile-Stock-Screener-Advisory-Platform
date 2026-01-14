import { useState, useEffect } from 'react';
import { getUserEmail } from '../utils/auth';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/auth/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },body: JSON.stringify({ email:'radha_1@gmail.com' })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched notifications:', data.notifications);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
const markAsRead = async (notificationId) => {
  if (!notificationId) return; // safety check

  try {
    const token = localStorage.getItem('access_token');

    const res = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to mark as read");
    }

    // Update local state
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    alert("Notification marked as read!"); // pop-up
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

  useEffect(() => {
    fetchNotifications();
  }, []);

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


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-50 mb-8">Notifications</h1>
          <div className="text-center text-slate-400">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-50 mb-8">Notifications</h1>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-slate-900/50 rounded-xl p-6 border border-slate-800 hover:bg-slate-800/70 transition-colors ${
                  !notification.is_read ? 'border-l-4 border-l-cyan-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-100">
                    {notification.title}
                  </h3>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 bg-cyan-500 text-slate-950 text-sm font-medium rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
                <p className="text-slate-300 mb-4">
                  {notification.message}
                </p>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>{notification.symbol && `${notification.symbol} • `}{formatTime(notification.created_at)}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
      </div>
    </div>
  );
}
