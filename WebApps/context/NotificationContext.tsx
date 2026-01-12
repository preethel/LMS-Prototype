"use client";

import { MOCK_NOTIFICATIONS, Notification } from "@/lib/mockData";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLMS } from "./LMSContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useLMS();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load initial mock notifications
  useEffect(() => {
    if (currentUser) {
      // Filter mock notifications for the current user
      const userNotifications = MOCK_NOTIFICATIONS.filter(
        (n) => n.userId === currentUser.id
      );

      // In a real app, we would fetch from API.
      // Here we just set it initially if empty, or distinct logic.
      // For simplicity in this prototype, we'll just load the mock ones every time context inits
      // but ideally we want to persist state in memory.
      setNotifications((prev) => {
        if (prev.length === 0) return userNotifications;
        return prev;
      });
    }
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addNotification = (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
