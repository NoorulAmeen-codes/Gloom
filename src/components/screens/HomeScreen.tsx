"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check, Clock, Sparkles, Plus, Image as ImageIcon, PartyPopper, WalletCards } from "lucide-react";
import { formatRupees } from "@/lib/expenses";
import { useApp } from "@/context/AppContext";
import { PhotoProofModal } from "@/components/PhotoProofModal";
import { ViewPhotoModal } from "@/components/ViewPhotoModal";

interface TaskItem {
  id: number;
  title: string;
  description: string;
  target_date: string | null;
  target_time: string | null;
  recurrence: string;
  requires_photo: boolean;
  is_completed: boolean;
  completion_id: number | null;
  completion_image_url: string | null;
  completion_notes: string | null;
}

export function HomeScreen() {
  const { user, setActiveTab, formatDate } = useApp();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<TaskItem[]>([]);
  const [tomorrowDate, setTomorrowDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);
  const [todayExpenseTotal, setTodayExpenseTotal] = useState(0);
  const [todayExpenseCount, setTodayExpenseCount] = useState(0);

  // Photo modal state
  const [proofModalTask, setProofModalTask] = useState<TaskItem | null>(null);

  // View photo modal state
  const [viewPhotoData, setViewPhotoData] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    taskTitle: string;
    notes?: string | null;
  }>({
    isOpen: false,
    imageUrl: null,
    taskTitle: "",
  });

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?scope=today");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.todaysTasks || []);
        setTomorrowTasks(data.tomorrowTasks || []);
        setTomorrowDate(data.tomorrowDate || "");
        setAllCompleted(!!data.allCompleted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: user?.timezone || undefined, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    fetch(`/api/expenses?date=${today}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const todayExpenses = data?.expenses || [];
        setTodayExpenseCount(todayExpenses.length);
        setTodayExpenseTotal(todayExpenses.reduce((sum: number, expense: { amount: string }) => sum + Number(expense.amount), 0));
      })
      .catch(() => undefined);
  }, [user?.timezone]);

  const handleToggleClick = (task: TaskItem) => {
    if (task.is_completed) {
      // Uncheck directly
      executeToggle(task.id, "uncomplete");
    } else {
      // If requires_photo, open photo proof modal
      if (task.requires_photo) {
        setProofModalTask(task);
      } else {
        executeToggle(task.id, "complete");
      }
    }
  };

  const executeToggle = async (
    taskId: number,
    action: "complete" | "uncomplete",
    imageUrl?: string | null,
    notes?: string | null
  ) => {
    try {
      // Optimistic update
      setTasks((prev) => {
        const next = prev.map((t) => {
          if (t.id === taskId) {
            const nextDone = action === "complete";
            return {
              ...t,
              is_completed: nextDone,
              completion_image_url: nextDone ? (imageUrl ?? t.completion_image_url) : null,
              completion_notes: nextDone ? (notes ?? t.completion_notes) : null,
            };
          }
          return t;
        });

        const pending = next.filter((t) => !t.is_completed).length;
        setAllCompleted(next.length > 0 && pending === 0);
        return next;
      });

      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, image_url: imageUrl, notes }),
      });

      if (!res.ok) {
        // Revert on failure
        loadTasks();
      }
    } catch (e) {
      console.error(e);
      loadTasks();
    }
  };

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6 pb-24 lg:pb-12 animate-in fade-in duration-300">
      {/* Greeting Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
          Hello,{" "}
          <span style={{ color: "var(--color-primary)" }}>
            {user?.name || "Alex"}
          </span>
        </h1>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
          Let&apos;s make today productive.
        </p>
      </div>

      {/* Daily expenses widget */}
      <div
        className="rounded-3xl p-5 shadow-sm border cursor-pointer active:scale-[0.99] transition-transform"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={() => setActiveTab("expenses")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setActiveTab("expenses"); }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}><WalletCards className="w-4 h-4" /></span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Today&apos;s spending</span>
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--color-text)" }}>{formatRupees(todayExpenseTotal)}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{todayExpenseCount} {todayExpenseCount === 1 ? "expense" : "expenses"}</p>
          </div>
          <button onClick={(event) => { event.stopPropagation(); setActiveTab("expenses"); window.setTimeout(() => window.dispatchEvent(new Event("gloop:add-expense")), 0); }} className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5" style={{ backgroundColor: "var(--color-primary)" }}><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pending Card */}
        <div
          className="p-5 rounded-3xl transition-transform hover:-translate-y-0.5 shadow-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: "var(--color-warning)",
              }}
            />
            <span
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              PENDING
            </span>
          </div>

          <div
            className="text-3xl font-black mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {pendingCount}
          </div>

          <p className="text-xs leading-tight" style={{ color: "var(--color-text-muted)" }}>
            tasks remaining today
          </p>
        </div>

        {/* Done Card */}
        <div
          className="p-5 rounded-3xl transition-transform hover:-translate-y-0.5 shadow-sm"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
              style={{
                backgroundColor: "var(--color-success)",
              }}
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              DONE
            </span>
          </div>

          <div
            className="text-3xl font-black mb-1"
            style={{ color: "var(--color-success)" }}
          >
            {completedCount}
          </div>

          <p className="text-xs leading-tight" style={{ color: "var(--color-text-muted)" }}>
            completed today
          </p>
        </div>
      </div>

      {/* Today's Tasks Section */}
      <div
        className="rounded-3xl p-5 shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Section Header with Accent Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-1.5 h-5 rounded-full"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              Today&apos;s Tasks
            </h2>
          </div>
          <button
            onClick={() => setActiveTab("tasks")}
            className="text-xs font-bold hover:underline transition-opacity"
            style={{ color: "var(--color-primary)" }}
          >
            View all
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            Loading your schedule...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 mx-auto opacity-40" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              No tasks scheduled for today
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Create a new habit or daily goal to kickstart your day.
            </p>
            <button
              onClick={() => setActiveTab("tasks")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition-transform"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus className="w-4 h-4" /> Add a task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => {
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl transition-all border ${
                    task.is_completed ? "opacity-85" : "hover:shadow-xs"
                  }`}
                  style={{
                    backgroundColor: task.is_completed
                      ? "var(--color-surface-alt)"
                      : "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  {/* Toggle Checkbox */}
                  <button
                    onClick={() => handleToggleClick(task)}
                    className="shrink-0 p-1 rounded-full transition-transform active:scale-90"
                    aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.is_completed ? (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: "var(--color-success)" }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span
                        className="w-6 h-6 rounded-full border-2 block transition-colors"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    )}
                  </button>

                  {/* Task Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (task.completion_image_url) {
                        setViewPhotoData({
                          isOpen: true,
                          imageUrl: task.completion_image_url,
                          taskTitle: task.title,
                          notes: task.completion_notes,
                        });
                      } else {
                        handleToggleClick(task);
                      }
                    }}
                  >
                    <h3
                      className={`text-sm font-semibold truncate transition-colors ${
                        task.is_completed ? "line-through opacity-70" : ""
                      }`}
                      style={{
                        color: task.is_completed
                          ? "var(--color-text-muted)"
                          : "var(--color-text)",
                      }}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Badges / Photo indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.requires_photo && (
                      <button
                        onClick={() => {
                          if (task.completion_image_url) {
                            setViewPhotoData({
                              isOpen: true,
                              imageUrl: task.completion_image_url,
                              taskTitle: task.title,
                              notes: task.completion_notes,
                            });
                          } else {
                            setProofModalTask(task);
                          }
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-transform hover:scale-105"
                        style={{
                          backgroundColor: task.completion_image_url
                            ? "var(--color-primary-light)"
                            : "var(--color-surface-alt)",
                          color: task.completion_image_url
                            ? "var(--color-primary)"
                            : "var(--color-text-muted)",
                          border: "1px solid var(--color-border)",
                        }}
                        title={task.completion_image_url ? "View photo proof" : "Requires photo proof"}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REVEAL RULE: Only once ALL today's tasks are completed, reveal "Upcoming — Tomorrow" section! */}
      {allCompleted && (
        <div
          className="rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400 border"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* Celebratory Banner */}
          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: "var(--color-primary-light)",
            }}
          >
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                All Today&apos;s Tasks Completed!
              </h4>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Great work! Here is an early preview of tomorrow&apos;s schedule.
              </p>
            </div>
          </div>

          {/* Tomorrow's Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--color-secondary)" }} />
              <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                Upcoming — Tomorrow ({formatDate(tomorrowDate)})
              </h3>
            </div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text-muted)",
              }}
            >
              {tomorrowTasks.length} tasks
            </span>
          </div>

          {/* Tomorrow Tasks List */}
          <div className="space-y-2">
            {tomorrowTasks.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                No tasks scheduled for tomorrow yet.
              </p>
            ) : (
              tomorrowTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate" style={{ color: "var(--color-text)" }}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {t.description}
                      </p>
                    )}
                  </div>
                  {t.requires_photo && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <ImageIcon className="w-3 h-3" /> Photo
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Photo Proof Modal */}
      {proofModalTask && (
        <PhotoProofModal
          isOpen={!!proofModalTask}
          taskTitle={proofModalTask.title}
          onClose={() => setProofModalTask(null)}
          onConfirm={async (imageUrl, notes) => {
            await executeToggle(proofModalTask.id, "complete", imageUrl, notes);
          }}
        />
      )}

      {/* View Photo Proof Modal */}
      <ViewPhotoModal
        isOpen={viewPhotoData.isOpen}
        onClose={() => setViewPhotoData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={viewPhotoData.imageUrl}
        taskTitle={viewPhotoData.taskTitle}
        notes={viewPhotoData.notes}
      />
    </div>
  );
}
