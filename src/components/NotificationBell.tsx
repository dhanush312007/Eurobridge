import React, { useState, useRef, useEffect } from 'react';
import { NotificationAlert, NotificationType } from '../types/index.ts';
import { 
  Bell, 
  CheckCheck, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  Award, 
  FileText 
} from 'lucide-react';

interface NotificationBellProps {
  notifications: NotificationAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateTab: (tab: string) => void;
  onClearReadHistory?: () => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
  onClearReadHistory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayedNotifications = filter === 'UNREAD' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const handleAlertClick = (alert: NotificationAlert) => {
    if (!alert.read) {
      onMarkAsRead(alert.id);
    }
    if (alert.targetTab) {
      onNavigateTab(alert.targetTab);
      setIsOpen(false);
    }
  };

  const getAlertIcon = (type: NotificationType) => {
    switch (type) {
      case 'DOCUMENT':
        return <FileCheck className="w-4 h-4 text-[#C5A880]" />;
      case 'EVALUATION':
      case 'FUTURE_TWIN':
        return <Sparkles className="w-4 h-4 text-[#C5A880]" />;
      case 'CLARIFICATION':
      case 'GAP2GROWTH':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'CONSULTANT':
      case 'INTERVIEW':
        return <Award className="w-4 h-4 text-[#C5A880]" />;
      default:
        return <FileText className="w-4 h-4 text-[#9C968A]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2.5 text-[#9C968A] hover:text-[#FAF6F0] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A880] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A880]" />
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111413] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-[#EDE8DE] animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-4 bg-[#161A18] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-base text-[#FAF6F0]">Dossier Activity</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded-full bg-[#C5A880] text-[#0B0D0C] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-[11px] text-[#C5A880] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 bg-[#111413] border-b border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'ALL' ? 'text-[#C5A880] font-semibold' : 'text-[#9C968A] hover:text-[#FAF6F0]'
                }`}
              >
                All ({notifications.length})
              </button>
              <span className="text-white/20">/</span>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'UNREAD' ? 'text-[#C5A880] font-semibold' : 'text-[#9C968A] hover:text-[#FAF6F0]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {onClearReadHistory && (
              <button
                type="button"
                onClick={onClearReadHistory}
                className="text-[10px] text-[#9C968A] hover:text-[#FAF6F0] transition-colors cursor-pointer"
              >
                Clear Read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9C968A]">
                {filter === 'UNREAD' ? 'Zero unread notifications.' : 'No activity notifications recorded.'}
              </div>
            ) : (
              displayedNotifications.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-4 hover:bg-[#161A18] transition-colors cursor-pointer flex items-start gap-3 text-xs ${
                    !alert.read ? 'bg-[#161A18]/60' : 'bg-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-medium ${!alert.read ? 'text-[#FAF6F0]' : 'text-[#9C968A]'}`}>
                        {alert.title}
                      </h4>
                      <span className="text-[10px] font-mono-numbers text-[#9C968A] shrink-0">
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9C968A] line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                    {alert.badgeText && (
                      <span className="inline-block text-[9px] font-mono-numbers uppercase px-1.5 py-0.2 rounded bg-white/5 text-[#C5A880] border border-white/10 mt-1">
                        {alert.badgeText}
                      </span>
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
};
