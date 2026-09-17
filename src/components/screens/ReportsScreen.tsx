"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Flame, Trophy, TrendingUp, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Image as ImageIcon, CheckCircle, XCircle, Info, Sparkles, Check, Activity } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ViewPhotoModal } from "@/components/ViewPhotoModal";

interface DayItem {
  date: string;
  totalScheduled: number;
  completedCount: number;
  percentage: number;
  isAllCompleted: boolean;
  items: Array<{
    taskId: number;
    title: string;
    description: string;
    requiresPhoto: boolean;
    isCompleted: boolean;
    imageUrl: string | null;
    notes: string | null;
  }>;
}

interface HeatmapCell {
  date: string;
  percentage: number;
  totalScheduled: number;
  completedCount: number;
  isAllCompleted: boolean;
  photoCount: number;
}

interface ChartItem {
  label: string;
  percentage: number;
  completed: number;
  total: number;
  date?: string;
  monthKey?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ReportsScreen() {
  const { formatDate } = useApp();
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  const [loading, setLoading] = useState(true);

  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });
  const [consistency, setConsistency] = useState({ rate30: 0, rate90: 0 });
  const [dailyChart, setDailyChart] = useState<ChartItem[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<ChartItem[]>([]);
  const [yearlyChart, setYearlyChart] = useState<ChartItem[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<HeatmapCell[]>([]);
  const [historyLog, setHistoryLog] = useState<DayItem[]>([]);

  // Interactive full monthly calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  // Selected Day Modal
  const [selectedDay, setSelectedDay] = useState<DayItem | null>(null);

  // View full photo proof modal
  const [previewPhoto, setPreviewPhoto] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    taskTitle: string;
    notes?: string | null;
    date?: string | null;
  }>({
    isOpen: false,
    imageUrl: null,
    taskTitle: "",
  });

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setStreaks(data.streaks || { currentStreak: 0, longestStreak: 0 });
        setConsistency(data.consistency || { rate30: 0, rate90: 0 });
        setDailyChart(data.dailyChart || []);
        setMonthlyChart(data.monthlyChart || []);
        setYearlyChart(data.yearlyChart || []);
        setHeatmapDays(data.heatmapDays || []);
        setHistoryLog(data.historyLog || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const activeChart =
    period === "daily"
      ? dailyChart
      : period === "monthly"
      ? monthlyChart
      : yearlyChart;

  const handleCellClick = (dateStr: string) => {
    const found = historyLog.find((h) => h.date === dateStr);
    if (found) {
      setSelectedDay(found);
    } else {
      const cell = heatmapDays.find((h) => h.date === dateStr);
      setSelectedDay({
        date: dateStr,
        totalScheduled: cell?.totalScheduled ?? 0,
        completedCount: cell?.completedCount ?? 0,
        percentage: cell?.percentage ?? 0,
        isAllCompleted: !!cell?.isAllCompleted,
        items: [],
      });
    }
  };

  // Build calendar matrix for current selected month & year
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      data?: HeatmapCell | DayItem;
    }> = [];

    // Preceding empty/prev month days
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({
        dayNumber: 0,
        dateStr: "",
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calendarMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateStr = `${calendarYear}-${mStr}-${dStr}`;

      const historyData = historyLog.find((h) => h.date === dateStr);
      const heatmapData = heatmapDays.find((h) => h.date === dateStr);

      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        data: historyData || heatmapData,
      });
    }

    return cells;
  }, [calendarYear, calendarMonth, historyLog, heatmapDays]);

  // Prev / Next month handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Calculate consistency trend line path (last 14 data points)
  const consistencyPoints = useMemo(() => {
    if (dailyChart.length === 0) return "";
    const width = 360;
    const height = 90;
    const step = width / Math.max(1, dailyChart.length - 1);

    const pts = dailyChart.map((item, idx) => {
      const x = idx * step;
      const y = height - (item.percentage / 100) * (height - 16) - 8;
      return `${x},${y}`;
    });

    return pts.join(" ");
  }, [dailyChart]);

  return (
    <div className="space-y-6 pb-24 lg:pb-12 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
          Progress & Reports
        </h1>
        <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          Consistency graphs, calendar heatmap, and habit adherence
        </p>
      </div>

      {/* Streaks & Consistency Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Current Streak */}
        <div
          className="p-4 rounded-3xl border transition-all hover:shadow-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-warning)" }}
            >
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Current Streak
            </span>
          </div>
          <div className="text-2xl font-black" style={{ color: "var(--color-text)" }}>
            {streaks.currentStreak} <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>days</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Consecutive 100% days
          </p>
        </div>

        {/* Longest Streak */}
        <div
          className="p-4 rounded-3xl border transition-all hover:shadow-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Best Streak
            </span>
          </div>
          <div className="text-2xl font-black" style={{ color: "var(--color-text)" }}>
            {streaks.longestStreak} <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>days</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Personal record
          </p>
        </div>

        {/* 30-Day Consistency */}
        <div
          className="p-4 rounded-3xl border transition-all hover:shadow-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              30D Consistency
            </span>
          </div>
          <div className="text-2xl font-black" style={{ color: "var(--color-success)" }}>
            {consistency.rate30}%
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Rolling completion rate
          </p>
        </div>

        {/* 90-Day Consistency */}
        <div
          className="p-4 rounded-3xl border transition-all hover:shadow-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="p-1.5 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-secondary)" }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              90D Rolling
            </span>
          </div>
          <div className="text-2xl font-black" style={{ color: "var(--color-text)" }}>
            {consistency.rate90}%
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Quarterly aggregate
          </p>
        </div>
      </div>

      {/* 1. CONSISTENCY GRAPH & SMOOTH TREND CHART */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Consistency Graph
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Rolling completion rate curve and daily adherence momentum
              </p>
            </div>
          </div>

          <div
            className="px-3 py-1 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
            }}
          >
            {consistency.rate30}% Avg
          </div>
        </div>

        {/* Consistency Area & Trend SVG */}
        <div className="pt-2">
          {dailyChart.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
              Not enough completion data to plot graph yet.
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox="0 0 360 100"
                className="w-full h-28 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="consistencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="360" y2="20" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
                <line x1="0" y1="50" x2="360" y2="50" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />
                <line x1="0" y1="80" x2="360" y2="80" stroke="var(--color-border)" strokeDasharray="3 3" opacity="0.6" />

                {/* Filled gradient area below line */}
                {consistencyPoints && (
                  <polygon
                    points={`0,95 ${consistencyPoints} 360,95`}
                    fill="url(#consistencyGradient)"
                  />
                )}

                {/* Trend line */}
                {consistencyPoints && (
                  <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={consistencyPoints}
                  />
                )}

                {/* Data point dots */}
                {dailyChart.map((d, idx) => {
                  const step = 360 / Math.max(1, dailyChart.length - 1);
                  const x = idx * step;
                  const y = 90 - (d.percentage / 100) * 74 - 8;
                  const is100 = d.percentage === 100;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={is100 ? 4.5 : 3}
                      fill={is100 ? "var(--color-success)" : "var(--color-primary)"}
                      stroke="var(--color-surface)"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* Chart Date Footers */}
              <div className="flex justify-between items-center text-[10px] pt-2 px-1 font-semibold" style={{ color: "var(--color-text-muted)" }}>
                <span>14 Days Ago</span>
                <span>Past 7 Days</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. FULL INTERACTIVE MONTHLY CALENDAR VIEW */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-secondary)" }}
            >
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Interactive Calendar
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {MONTH_NAMES[calendarMonth]} {calendarYear} • Tap any day to inspect photo proofs & tasks
              </p>
            </div>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border hover:opacity-80 transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-1.5" style={{ color: "var(--color-text)" }}>
              {MONTH_NAMES[calendarMonth].slice(0, 3)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border hover:opacity-80 transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                {wd}
              </span>
            ))}
          </div>

          {/* Day tiles */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square rounded-2xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: "var(--color-surface-alt)" }}
                  />
                );
              }

              const hasData = !!cell.data;
              const pct = cell.data ? cell.data.percentage : 0;
              const is100 = pct === 100;
              const hasPhotos =
                ("photoCount" in (cell.data || {}) && (cell.data as HeatmapCell).photoCount > 0) ||
                ("items" in (cell.data || {}) && (cell.data as DayItem).items.some((i) => i.imageUrl));

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => handleCellClick(cell.dateStr)}
                  className="aspect-square rounded-2xl border p-1 sm:p-1.5 flex flex-col justify-between transition-all hover:scale-105 active:scale-95 group relative text-left"
                  style={{
                    backgroundColor: is100
                      ? "var(--color-success)"
                      : pct >= 50
                      ? "var(--color-primary-light)"
                      : "var(--color-surface-alt)",
                    borderColor: is100
                      ? "var(--color-success)"
                      : pct >= 50
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    color: is100 ? "#ffffff" : "var(--color-text)",
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-none">
                      {cell.dayNumber}
                    </span>
                    {hasPhotos && (
                      <ImageIcon className="w-2.5 h-2.5 shrink-0 opacity-80" />
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between">
                    {hasData && (
                      <span className={`text-[9px] font-semibold leading-none ${is100 ? "text-white" : "opacity-75"}`}>
                        {pct}%
                      </span>
                    )}
                    {is100 && (
                      <Check className="w-2.5 h-2.5 stroke-[3] text-white ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: "var(--color-text-muted)" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border" style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)" }} />
            <span>0% / Incomplete</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-primary)" }} />
            <span>50%+ Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: "var(--color-success)" }} />
            <span>100% Complete</span>
          </div>
        </div>
      </div>

      {/* 3. PERIODIC BAR CHART (Daily / Monthly / Yearly) */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              Completion Breakdown
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Switch between Daily, Monthly, or Yearly aggregation
            </p>
          </div>

          {/* Segmented Control */}
          <div
            className="flex items-center p-1 rounded-2xl border self-start sm:self-auto"
            style={{
              backgroundColor: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
            }}
          >
            {(["daily", "monthly", "yearly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPeriod(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  period === mode ? "shadow-xs" : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: period === mode ? "var(--color-surface)" : "transparent",
                  color: period === mode ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-2">
          {activeChart.length === 0 ? (
            <div className="py-12 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
              No data recorded for this view.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-2 sm:gap-3 px-2 pt-4 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
                {activeChart.map((item, idx) => {
                  const heightPercent = Math.max(8, item.percentage);
                  const is100 = item.percentage === 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      onClick={() => item.date && handleCellClick(item.date)}
                    >
                      {/* Tooltip on hover */}
                      <div
                        className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-md z-20 whitespace-nowrap transition-opacity"
                        style={{ backgroundColor: "var(--color-text)" }}
                      >
                        {item.percentage}% ({item.completed}/{item.total})
                      </div>

                      <div
                        className="w-full rounded-t-lg transition-all duration-300 relative overflow-hidden"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: is100
                            ? "var(--color-success)"
                            : item.percentage > 50
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        }}
                      >
                        {is100 && (
                          <div
                            className="absolute top-1 left-0 right-0 flex justify-center text-white"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Labels below chart */}
              <div className="flex items-center gap-2 sm:gap-3 px-2 text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                {activeChart.map((item, idx) => (
                  <div key={idx} className="flex-1 text-center truncate">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. SCROLLABLE HISTORY LOG */}
      <div
        className="rounded-3xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            History Log
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Past {historyLog.length} days
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto pr-1 space-y-2">
          {historyLog.map((day) => {
            const hasPhotos = day.items.some((it) => it.imageUrl);
            return (
              <div
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className="pt-2 pb-2 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: day.isAllCompleted
                        ? "var(--color-success)"
                        : day.percentage > 0
                        ? "var(--color-primary-light)"
                        : "var(--color-surface-alt)",
                      color: day.isAllCompleted
                        ? "#ffffff"
                        : day.percentage > 0
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {day.percentage}%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--color-text)" }}>
                      {formatDate(day.date)}
                    </h4>
                    <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                      {day.completedCount} of {day.totalScheduled} tasks finished
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasPhotos && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1"
                      style={{
                        backgroundColor: "var(--color-primary-light)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <ImageIcon className="w-3 h-3" /> Photo
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day History Modal with Photo Proofs */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
                  {formatDate(selectedDay.date)}
                </h3>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {selectedDay.completedCount} / {selectedDay.totalScheduled} completed ({selectedDay.percentage}%)
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-full hover:opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* List of Tasks for this day */}
            <div className="space-y-3">
              {selectedDay.items.length === 0 ? (
                <p className="text-xs py-6 text-center" style={{ color: "var(--color-text-muted)" }}>
                  No scheduled tasks recorded on this date.
                </p>
              ) : (
                selectedDay.items.map((item) => (
                  <div
                    key={item.taskId}
                    className="p-3.5 rounded-2xl border space-y-2"
                    style={{
                      backgroundColor: item.isCompleted ? "var(--color-surface-alt)" : "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.isCompleted ? (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: "var(--color-success)" }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span
                            className="w-5 h-5 rounded-full border-2 block"
                            style={{ borderColor: "var(--color-border)" }}
                          />
                        )}
                        <h4
                          className={`text-xs font-bold ${item.isCompleted ? "line-through opacity-70" : ""}`}
                          style={{ color: "var(--color-text)" }}
                        >
                          {item.title}
                        </h4>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: item.isCompleted ? "var(--color-primary-light)" : "var(--color-surface-alt)",
                          color: item.isCompleted ? "var(--color-primary)" : "var(--color-text-muted)",
                        }}
                      >
                        {item.isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] italic pl-7" style={{ color: "var(--color-text-muted)" }}>
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    {/* Proof Photo Thumbnail */}
                    {item.imageUrl && (
                      <div className="pl-7 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewPhoto({
                              isOpen: true,
                              imageUrl: item.imageUrl,
                              taskTitle: item.title,
                              notes: item.notes,
                              date: formatDate(selectedDay.date),
                            });
                          }}
                          className="flex items-center gap-2 p-1.5 rounded-xl border hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                          }}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] font-bold block" style={{ color: "var(--color-primary)" }}>
                              View Photo Proof
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                              Tap to inspect
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* View full photo modal */}
      <ViewPhotoModal
        isOpen={previewPhoto.isOpen}
        onClose={() => setPreviewPhoto((p) => ({ ...p, isOpen: false }))}
        imageUrl={previewPhoto.imageUrl}
        taskTitle={previewPhoto.taskTitle}
        notes={previewPhoto.notes}
        date={previewPhoto.date}
      />
    </div>
  );
}
