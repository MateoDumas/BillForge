import { useState, useEffect, useRef } from "react";
import { Notification } from "../types";
import { getWithAuth, postWithAuth } from "../api";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils";

interface NotificationsProps {
  token: string;
}

export function Notifications({ token }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (token) {
      loadNotifications();
      // Poll every minute
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadNotifications() {
    const result = await getWithAuth<{ notifications: Notification[] }>("/notifications", token);
    if (result.data) {
      setNotifications(result.data.notifications);
    }
  }

  async function markAsRead(id: string) {
    const result = await postWithAuth(`/notifications/${id}/read`, {}, token);
    if (!result.error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }

  async function markAllAsRead() {
    const result = await postWithAuth("/notifications/read-all", {}, token);
    if (!result.error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className="btn btn-ghost btn-circle notifications-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones"
      >
        <span style={{ fontSize: '1.5rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="btn-link"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                No tienes notificaciones
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.type}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-content-wrapper">
                    <span className="notification-icon">
                      {notification.type === 'success' && '✅'}
                      {notification.type === 'warning' && '⚠️'}
                      {notification.type === 'error' && '❌'}
                      {notification.type === 'info' && 'ℹ️'}
                    </span>
                    <div className="notification-text">
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <span className="notification-date">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="notification-dot"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
