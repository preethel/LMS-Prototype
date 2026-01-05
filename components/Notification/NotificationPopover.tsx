"use client";

import { useNotification } from "@/context/NotificationContext";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NotificationItem from "./NotificationItem";

export default function NotificationPopover() {
  const { notifications, unreadCount, markAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
    // Link navigation is handled by the Link component inside NotificationItem or here if we want manual control
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 z-50 origin-top-right">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs text-indigo-600 font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map(
                (
                  notification // Show only recent 5
                ) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                )
              )
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50 text-center rounded-b-lg">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
