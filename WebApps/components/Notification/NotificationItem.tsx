"use client";

import { Notification } from "@/lib/mockData";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import Link from "next/link";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const content = (
    <div
      className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors ${
        !notification.isRead ? "bg-blue-50/50" : ""
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p
            className={`text-sm font-medium ${
              !notification.isRead ? "text-gray-900" : "text-gray-700"
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link
        href={notification.link}
        onClick={onClick}
        className="block border-b border-gray-100 last:border-0"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer border-b border-gray-100 last:border-0"
    >
      {content}
    </div>
  );
}
