'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Icon, type IconName } from '@/components/icon';

export interface Notification {
  id: string;
  type: 'policy' | 'claim' | 'transaction';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'policy',
    title: 'Policy Updated',
    message: 'Your weather protection policy has been activated.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    type: 'claim',
    title: 'Claim Approved',
    message: 'Your claim POL-2024-00124 has been approved for payment.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    type: 'transaction',
    title: 'Premium Paid',
    message: 'Your premium payment of 1000 XLM has been confirmed.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
  },
];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getNotificationIcon(type: Notification['type']): IconName {
  const iconMap: Record<Notification['type'], IconName> = {
    policy: 'shield',
    claim: 'document',
    transaction: 'wallet',
  };
  return iconMap[type];
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsPanel({
  isOpen,
  onClose,
  returnFocusRef,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      returnFocusRef?.current?.focus();
    }
  }, [isOpen, returnFocusRef]);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setNotifications(MOCK_NOTIFICATIONS);
      } catch (err) {
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [isOpen]);

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      requestClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
    ).filter((element) => !element.hasAttribute('disabled'));

    if (focusableElements.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function clearAll() {
    setNotifications([]);
  }

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="notifications-panel-overlay" onClick={requestClose} />
      <div
        ref={panelRef}
        className="notifications-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-panel-title"
        onKeyDown={handlePanelKeyDown}
        tabIndex={-1}
      >
        <div className="notifications-header">
          <h2 id="notifications-panel-title" className="notifications-title">
            Notifications
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="notifications-close"
            onClick={requestClose}
            aria-label="Close notifications panel"
          >
            <Icon name="close" size="md" tone="muted" />
          </button>
        </div>

        {error && (
          <div className="notifications-error" role="alert">
            <Icon name="alert" size="sm" tone="danger" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="notifications-loading">
            <div className="spinner" aria-label="Loading notifications" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notifications-empty">
            <Icon name="bell" size="lg" tone="muted" />
            <p className="notifications-empty-text">No notifications yet</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <>
            {unreadCount > 0 && (
              <div className="notifications-badge">
                {unreadCount} new{' '}
                {unreadCount === 1 ? 'notification' : 'notifications'}
              </div>
            )}

            <div className="notifications-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className="notification-icon">
                    <Icon
                      name={getNotificationIcon(notification.type)}
                      size="md"
                      tone="accent"
                    />
                  </span>
                  <span className="notification-content">
                    <span className="notification-title">
                      {notification.title}
                    </span>
                    <span className="notification-message">
                      {notification.message}
                    </span>
                    <time
                      className="notification-time"
                      dateTime={notification.timestamp.toISOString()}
                    >
                      {formatTime(notification.timestamp)}
                    </time>
                  </span>
                  {!notification.read && (
                    <span className="notification-unread-indicator" />
                  )}
                </button>
              ))}
            </div>

            <div className="notifications-footer">
              <button
                type="button"
                className="notifications-btn"
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
