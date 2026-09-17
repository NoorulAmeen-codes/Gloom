"use client";

import React, { useState } from "react";
import { User, Palette, Globe, Calendar, RefreshCw, Check, Sparkles, LogOut, Sun, Moon, Shield } from "lucide-react";
import { useApp, PRESET_THEMES, ThemeColors } from "@/context/AppContext";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g. 09/17/2026)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g. 17/09/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g. 2026-09-17)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (e.g. 17.09.2026)" },
];

const COLOR_DESCRIPTIONS: Record<keyof ThemeColors, string> = {
  "--color-primary": "Primary Accent (Buttons, Highlights)",
  "--color-primary-light": "Primary Light Tint (Badge background)",
  "--color-secondary": "Secondary Accent (Sub-highlights)",
  "--color-bg": "App Background",
  "--color-surface": "Card & Container Surface",
  "--color-surface-alt": "Surface Alternate (Inner cards/inputs)",
  "--color-text": "Primary Text",
  "--color-text-muted": "Secondary / Muted Text",
  "--color-border": "Border & Divider Lines",
  "--color-success": "Success / Done State",
  "--color-danger": "Danger / Alerts",
  "--color-warning": "Warning / Pending State",
};

export function ProfileScreen() {
  const {
    user,
    themeColors,
    updateColorProperty,
    applyPreset,
    saveCurrentTheme,
    resetThemeToDefault,
    updateProfile,
    refreshUser,
  } = useApp();

  const [name, setName] = useState(user?.name || "Alex");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [timezone, setTimezone] = useState(user?.timezone || "America/New_York");
  const [dateFormat, setDateFormat] = useState(user?.date_format || "MM/DD/YYYY");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reloadingSeed, setReloadingSeed] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const success = await updateProfile({
      name,
      avatar,
      timezone,
      date_format: dateFormat,
    });
    setSavingProfile(false);
    if (success) {
      showToast("Profile & settings updated successfully!");
    }
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    const success = await saveCurrentTheme();
    setSavingTheme(false);
    if (success) {
      showToast("Custom theme saved to database!");
    }
  };

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
        showToast(`Detected timezone: ${detected}`);
      }
    } catch {
      showToast("Could not auto-detect timezone.");
    }
  };

  const handleResetSampleData = async () => {
    if (!confirm("Reset all tasks, quotes, and sample streak data to fresh defaults?")) return;
    setReloadingSeed(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await refreshUser();
        showToast("Database refreshed with sample demo data!");
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReloadingSeed(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 lg:pb-12 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            borderColor: "var(--color-success)",
          }}
        >
          <Check className="w-4 h-4" style={{ color: "var(--color-success)" }} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
          Settings & Profile
        </h1>
        <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          Configure your user identity, date formats, and complete theme system
        </p>
      </div>

      {/* User Card */}
      <div
        className="p-5 rounded-3xl border shadow-sm flex items-center gap-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2"
          style={{ borderColor: "var(--color-primary)" }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-xl text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black truncate" style={{ color: "var(--color-text)" }}>
            {name}
          </h2>
          <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
            Timezone: {timezone} • Format: {dateFormat}
          </p>
        </div>
      </div>

      {/* Section 1: Appearance & Root CSS Color Palette */}
      <div
        className="p-5 rounded-3xl border shadow-sm space-y-5"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Appearance & Theme System
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Global CSS custom properties on :root — re-themes the entire app instantly
              </p>
            </div>
          </div>
        </div>

        {/* Preset Palettes */}
        <div className="space-y-2">
          <label className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
            Theme Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(PRESET_THEMES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="p-3 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95 shadow-xs"
                style={{
                  backgroundColor: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div>
                  <span className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
                    {item.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] block opacity-70" style={{ color: "var(--color-text-muted)" }}>
                    {key === "midnight" ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: item.colors["--color-primary"] }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: item.colors["--color-bg"] }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Individual CSS Color Pickers */}
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
              Customize Individual Root Variables
            </label>
            <button
              onClick={resetThemeToDefault}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Reset to default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(COLOR_DESCRIPTIONS) as Array<keyof ThemeColors>).map((colorKey) => {
              const currentValue = themeColors[colorKey] || "#ffffff";
              return (
                <div
                  key={colorKey}
                  className="p-2.5 rounded-xl border flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold block truncate" style={{ color: "var(--color-text)" }}>
                      {colorKey}
                    </span>
                    <span className="text-[10px] block truncate" style={{ color: "var(--color-text-muted)" }}>
                      {COLOR_DESCRIPTIONS[colorKey]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-mono font-semibold uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {currentValue}
                    </span>
                    <input
                      type="color"
                      value={currentValue.startsWith("#") ? currentValue : "#5046e5"}
                      onChange={(e) => updateColorProperty(colorKey, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveTheme}
              disabled={savingTheme}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 transition-transform active:scale-95"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Check className="w-4 h-4" />
              {savingTheme ? "Saving Theme..." : "Save Custom Theme"}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Profile & Regional Settings */}
      <form
        onSubmit={handleSaveProfile}
        className="p-5 rounded-3xl border shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              Profile & Regional Preferences
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Controls how dates, times, and greetings appear across the app
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.pexels.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
                Timezone
              </label>
              <button
                type="button"
                onClick={handleAutoDetectTimezone}
                className="text-[10px] font-semibold hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Auto-detect
              </button>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            >
              {DATE_FORMATS.map((df) => (
                <option key={df.value} value={df.value}>
                  {df.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 transition-transform active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Check className="w-4 h-4" />
            {savingProfile ? "Saving Profile..." : "Save Preferences"}
          </button>
        </div>
      </form>

      {/* Section 3: Data Management & Reset */}
      <div
        className="p-5 rounded-3xl border shadow-sm flex items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            Sample Demo Data
          </h3>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Reset tasks, history log, streak stats, and motivational quotes to original sample state.
          </p>
        </div>

        <button
          onClick={handleResetSampleData}
          disabled={reloadingSeed}
          className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:opacity-80 shrink-0 inline-flex items-center gap-1.5"
          style={{
            backgroundColor: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
            color: "var(--color-danger)",
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reloadingSeed ? "animate-spin" : ""}`} />
          {reloadingSeed ? "Resetting..." : "Reset Data"}
        </button>
      </div>
    </div>
  );
}
