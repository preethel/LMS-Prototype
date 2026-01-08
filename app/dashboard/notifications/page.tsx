"use client";

import NotificationItem from "@/components/Notification/NotificationItem";
import { useNotification } from "@/context/NotificationContext";
import { useState } from "react";

export default function NotificationsPage() {
  const { notifications, markAllAsRead } = useNotification();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex space-x-3">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === "all"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === "unread"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Unread
            </button>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                // We're letting the Item handle the click logic (link navigation + mark as read if we passed a handler)
                // But for the page view, usually just viewing it is enough?
                // Or maybe we want to explicitly mark as read when they click?
                // The item itself will link out.
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">🔕</span>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You&apos;re all caught up! Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
