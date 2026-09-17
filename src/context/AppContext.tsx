"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { formatDateWithPattern, getTodayString } from "@/lib/date-utils";

export interface ThemeColors {
  "--color-primary": string;
  "--color-primary-light": string;
  "--color-secondary": string;
  "--color-bg": string;
  "--color-surface": string;
  "--color-surface-alt": string;
  "--color-text": string;
  "--color-text-muted": string;
  "--color-border": string;
  "--color-success": string;
  "--color-danger": string;
  "--color-warning": string;
}

export const PRESET_THEMES: Record<string, { name: string; colors: ThemeColors }> = {
  indigo: {
    name: "Indigo Modern (Default)",
    colors: {
      "--color-primary": "#5046e5",
      "--color-primary-light": "#eeedfd",
      "--color-secondary": "#6366f1",
      "--color-bg": "#f8fafc",
      "--color-surface": "#ffffff",
      "--color-surface-alt": "#f1f5f9",
      "--color-text": "#0f172a",
      "--color-text-muted": "#64748b",
      "--color-border": "#e2e8f0",
      "--color-success": "#10b981",
      "--color-danger": "#ef4444",
      "--color-warning": "#f59e0b",
    },
  },
  midnight: {
    name: "Midnight Obsidian (Dark)",
    colors: {
      "--color-primary": "#6366f1",
      "--color-primary-light": "#1e1b4b",
      "--color-secondary": "#a855f7",
      "--color-bg": "#090d16",
      "--color-surface": "#121826",
      "--color-surface-alt": "#1e293b",
      "--color-text": "#f8fafc",
      "--color-text-muted": "#94a3b8",
      "--color-border": "#283347",
      "--color-success": "#34d399",
      "--color-danger": "#f87171",
      "--color-warning": "#fbbf24",
    },
  },
  emerald: {
    name: "Emerald Sage",
    colors: {
      "--color-primary": "#059669",
      "--color-primary-light": "#ecfdf5",
      "--color-secondary": "#10b981",
      "--color-bg": "#f4f9f6",
      "--color-surface": "#ffffff",
      "--color-surface-alt": "#e6f4ea",
      "--color-text": "#064e3b",
      "--color-text-muted": "#3b7264",
      "--color-border": "#d1fae5",
      "--color-success": "#10b981",
      "--color-danger": "#e11d48",
      "--color-warning": "#d97706",
    },
  },
  sunset: {
    name: "Sunset Coral",
    colors: {
      "--color-primary": "#ea580c",
      "--color-primary-light": "#fff7ed",
      "--color-secondary": "#f97316",
      "--color-bg": "#fffaf5",
      "--color-surface": "#ffffff",
      "--color-surface-alt": "#ffedd5",
      "--color-text": "#431407",
      "--color-text-muted": "#9a3412",
      "--color-border": "#fed7aa",
      "--color-success": "#16a34a",
      "--color-danger": "#dc2626",
      "--color-warning": "#f59e0b",
    },
  },
  lavender: {
    name: "Lavender Dream",
    colors: {
      "--color-primary": "#9333ea",
      "--color-primary-light": "#faf5ff",
      "--color-secondary": "#a855f7",
      "--color-bg": "#fbf8ff",
      "--color-surface": "#ffffff",
      "--color-surface-alt": "#f3e8ff",
      "--color-text": "#3b0764",
      "--color-text-muted": "#7e22ce",
      "--color-border": "#e9d5ff",
      "--color-success": "#10b981",
      "--color-danger": "#e11d48",
      "--color-warning": "#f59e0b",
    },
  },
  ocean: {
    name: "Ocean Breeze",
    colors: {
      "--color-primary": "#0284c7",
      "--color-primary-light": "#f0f9ff",
      "--color-secondary": "#38bdf8",
      "--color-bg": "#f8fafc",
      "--color-surface": "#ffffff",
      "--color-surface-alt": "#e0f2fe",
      "--color-text": "#0c4a6e",
      "--color-text-muted": "#0369a1",
      "--color-border": "#bae6fd",
      "--color-success": "#10b981",
      "--color-danger": "#ef4444",
      "--color-warning": "#f59e0b",
    },
  },
};

export interface UserProfile {
  id: number;
  name: string;
  avatar: string;
  timezone: string;
  date_format: string;
  theme: string | null;
}

interface AppContextType {
  user: UserProfile | null;
  themeColors: ThemeColors;
  activeTab: "home" | "reports" | "notes" | "tasks" | "profile";
  setActiveTab: (tab: "home" | "reports" | "notes" | "tasks" | "profile") => void;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
  updateColorProperty: (key: keyof ThemeColors, value: string) => void;
  applyPreset: (presetKey: string) => Promise<void>;
  saveCurrentTheme: () => Promise<boolean>;
  resetThemeToDefault: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  formatDate: (dateStr?: string) => string;
  getFormattedToday: () => string;
  refreshUser: () => Promise<void>;
  notificationModalOpen: boolean;
  setNotificationModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors>(PRESET_THEMES.indigo.colors);
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "notes" | "tasks" | "profile">("home");
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Apply CSS variables directly to :root
  const applyColorsToDocument = useCallback((colors: ThemeColors) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (data.user.theme) {
            try {
              const parsed = typeof data.user.theme === "string" ? JSON.parse(data.user.theme) : data.user.theme;
              const merged = { ...PRESET_THEMES.indigo.colors, ...parsed };
              setThemeColors(merged);
              applyColorsToDocument(merged);
            } catch {
              applyColorsToDocument(PRESET_THEMES.indigo.colors);
            }
          } else {
            applyColorsToDocument(PRESET_THEMES.indigo.colors);
          }
        }
      }

      // Check unread notifications count
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (typeof notifData.unreadCount === "number") {
          setUnreadNotifications(notifData.unreadCount);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  }, [applyColorsToDocument]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const updateColorProperty = (key: keyof ThemeColors, value: string) => {
    const updated = { ...themeColors, [key]: value };
    setThemeColors(updated);
    applyColorsToDocument(updated);
  };

  const applyPreset = async (presetKey: string) => {
    const preset = PRESET_THEMES[presetKey];
    if (preset) {
      setThemeColors(preset.colors);
      applyColorsToDocument(preset.colors);
      try {
        await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: JSON.stringify(preset.colors) }),
        });
      } catch (e) {
        console.error("Failed to save preset theme:", e);
      }
    }
  };

  const saveCurrentTheme = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: JSON.stringify(themeColors) }),
      });
      return res.ok;
    } catch (e) {
      console.error("Failed to save theme:", e);
      return false;
    }
  };

  const resetThemeToDefault = async () => {
    const defaultColors = PRESET_THEMES.indigo.colors;
    setThemeColors(defaultColors);
    applyColorsToDocument(defaultColors);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: JSON.stringify(defaultColors) }),
    });
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update profile:", err);
      return false;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return formatDateWithPattern(dateStr, user?.date_format || "MM/DD/YYYY");
  };

  const getFormattedToday = () => {
    const today = getTodayString(user?.timezone || undefined);
    return formatDateWithPattern(today, user?.date_format || "MM/DD/YYYY");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        themeColors,
        activeTab,
        setActiveTab,
        unreadNotifications,
        setUnreadNotifications,
        updateColorProperty,
        applyPreset,
        saveCurrentTheme,
        resetThemeToDefault,
        updateProfile,
        formatDate,
        getFormattedToday,
        refreshUser: fetchUserData,
        notificationModalOpen,
        setNotificationModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
