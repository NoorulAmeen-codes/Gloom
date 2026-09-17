"use client";

import React from "react";
import { Home, Calendar, FileText, CheckSquare, User, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function Navigation() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    {
      id: "home" as const,
      label: "Home",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
          viewBox="0 0 24 24"
          fill={isActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={isActive ? "2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" fill={isActive ? "var(--color-surface, #ffffff)" : "none"} stroke={isActive ? "var(--color-surface, #ffffff)" : "currentColor"} />
        </svg>
      ),
    },
    {
      id: "reports" as const,
      label: "Reports",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          {/* Calendar dots */}
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="17" r="1" fill="currentColor" />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "notes" as const,
      label: "Notes",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: "tasks" as const,
      label: "Tasks",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      id: "profile" as const,
      label: "Profile",
      icon: (isActive: boolean) => (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop & Laptop Sidebar (≥1025px) */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 p-5 transition-colors border-r"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-2 mb-8">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            G
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight" style={{ color: "var(--color-text)" }}>
              Gloop
            </h1>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              Habit & Photo Tracker
            </p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-150 ${
                  isActive ? "shadow-xs font-bold" : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: isActive ? "var(--color-primary-light)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                <div
                  className="p-1.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                    color: isActive ? "#ffffff" : "currentColor",
                  }}
                >
                  {item.icon(isActive)}
                </div>
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Motivational pill */}
        <div
          className="p-4 rounded-2xl mt-auto space-y-2 border"
          style={{
            backgroundColor: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--color-text)" }}>
              Stay Consistent
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Small daily habits compound into lifelong transformations.
          </p>
        </div>
      </aside>

      {/* Mobile & Tablet Bottom Bar (<1025px) - Exact match to Option A wireframe */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t transition-colors"
        style={{
          backgroundColor: "var(--color-surface, #ffffff)",
          borderColor: "var(--color-border, #e2e8f0)",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-1 group transition-all active:scale-95"
                style={{
                  color: isActive ? "var(--color-primary, #5046e5)" : "var(--color-text-muted, #64748b)",
                }}
              >
                {/* Icon Container with rounded background for Home if active as in wireframe */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? "rounded-xl" : ""
                  }`}
                  style={{
                    backgroundColor: isActive ? "var(--color-primary-light, #eeedfd)" : "transparent",
                    color: isActive ? "var(--color-primary, #5046e5)" : "var(--color-text-muted, #64748b)",
                  }}
                >
                  {item.icon(isActive)}
                </div>
                <span
                  className="text-[11px] font-semibold mt-0.5 tracking-tight transition-colors"
                  style={{
                    color: isActive ? "var(--color-primary, #5046e5)" : "var(--color-text-muted, #64748b)",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
