"use client";

import React, { useEffect, useState } from "react";
import { X, Bell, CheckCheck, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function NotificationsModal() {
  const { notificationModalOpen, setNotificationModalOpen, setUnreadNotifications } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notificationModalOpen) {
      loadNotifications();
    }
  }, [notificationModalOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  if (!notificationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] transition-colors"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg"
              style={{
                backgroundColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base" style={{ color: "var(--color-text)" }}>
              Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text-muted)",
              }}
            >
              <span className="flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </span>
            </button>
            <button
              onClick={() => setNotificationModalOpen(false)}
              className="p-1 rounded-full hover:opacity-70"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 divide-y-0">
          {loading ? (
            <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Loading updates...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto opacity-40" style={{ color: "var(--color-primary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                You are all caught up! No notifications right now.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markSingleRead(n.id)}
                className="p-3 rounded-xl transition-all cursor-pointer relative"
                style={{
                  backgroundColor: n.read ? "var(--color-surface-alt)" : "var(--color-primary-light)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {!n.read && (
                  <span
                    className="absolute top-3 right-3 w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                )}
                <h4 className="text-sm font-bold pr-4" style={{ color: "var(--color-text)" }}>
                  {n.title}
                </h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {n.message}
                </p>
                <span
                  className="text-[10px] mt-2 block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {new Date(n.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
