"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function TopBar() {
  const { getFormattedToday, unreadNotifications, setNotificationModalOpen } = useApp();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 transition-colors"
      style={{
        backgroundColor: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          {getFormattedToday()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotificationModalOpen(true)}
          className="relative p-2 rounded-full transition-transform active:scale-95 hover:opacity-80"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
          }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse"
              style={{
                backgroundColor: "var(--color-danger)",
                borderColor: "var(--color-surface)",
              }}
            />
          )}
        </button>
      </div>
    </header>
  );
}
