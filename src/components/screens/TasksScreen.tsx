"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Check, Clock, Calendar, Image as ImageIcon, Edit2, Trash2, X, CheckSquare, Sparkles, Filter, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ViewPhotoModal } from "@/components/ViewPhotoModal";

interface TaskRecord {
  id: number;
  title: string;
  description: string;
  target_date: string | null;
  target_time: string | null;
  recurrence: string;
  recurrence_days: string | null;
  requires_photo: boolean;
  total_completions: number;
  latest_completion: {
    id: number;
    date: string;
    image_url: string | null;
    notes: string | null;
  } | null;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TasksScreen() {
  const { formatDate } = useApp();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "daily" | "photo">("all");

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);

  // Detail view modal state
  const [detailTask, setDetailTask] = useState<{
    task: TaskRecord;
    history: Array<{
      id: number;
      date: string;
      image_url: string | null;
      notes: string | null;
      completed_at: string;
    }>;
  } | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetTime, setTargetTime] = useState("09:00");
  const [recurrence, setRecurrence] = useState("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo viewer
  const [viewPhoto, setViewPhoto] = useState<{
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

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.allTasks || []);
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

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setTargetDate(new Date().toISOString().split("T")[0]);
    setTargetTime("09:00");
    setRecurrence("daily");
    setSelectedDays([1, 2, 3, 4, 5]);
    setRequiresPhoto(false);
    setModalOpen(true);
  };

  const openEditModal = (t: TaskRecord) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setTargetDate(t.target_date || new Date().toISOString().split("T")[0]);
    setTargetTime(t.target_time || "09:00");
    setRecurrence(t.recurrence || "daily");
    if (t.recurrence_days) {
      try {
        setSelectedDays(JSON.parse(t.recurrence_days));
      } catch {
        setSelectedDays([1, 2, 3, 4, 5]);
      }
    }
    setRequiresPhoto(t.requires_photo);
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        target_date: targetDate,
        target_time: targetTime,
        recurrence,
        recurrence_days: recurrence === "custom" ? selectedDays : null,
        requires_photo: requiresPhoto,
      };

      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setModalOpen(false);
          loadTasks();
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setModalOpen(false);
          loadTasks();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task? All completion records will be removed.")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (detailTask?.task.id === id) {
          setDetailTask(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openTaskDetail = async (task: TaskRecord) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailTask({
          task,
          history: data.history || [],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "daily") return t.recurrence === "daily";
    if (filter === "photo") return t.requires_photo;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
            Task Directory
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            Manage recurring schedules, reminders, and photo rules
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 active:scale-95 transition-transform"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex items-center p-1 rounded-2xl border w-fit"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === "all" ? "shadow-xs" : "hover:opacity-80"
          }`}
          style={{
            backgroundColor: filter === "all" ? "var(--color-surface-alt)" : "transparent",
            color: filter === "all" ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("daily")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === "daily" ? "shadow-xs" : "hover:opacity-80"
          }`}
          style={{
            backgroundColor: filter === "daily" ? "var(--color-surface-alt)" : "transparent",
            color: filter === "daily" ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          Daily ({tasks.filter((t) => t.recurrence === "daily").length})
        </button>
        <button
          onClick={() => setFilter("photo")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === "photo" ? "shadow-xs" : "hover:opacity-80"
          }`}
          style={{
            backgroundColor: filter === "photo" ? "var(--color-surface-alt)" : "transparent",
            color: filter === "photo" ? "var(--color-text)" : "var(--color-text-muted)",
          }}
        >
          Photo Required ({tasks.filter((t) => t.requires_photo).length})
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-16 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          Loading your habits and tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className="p-10 rounded-3xl text-center space-y-3 border"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Sparkles className="w-10 h-10 mx-auto opacity-40" style={{ color: "var(--color-primary)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            No tasks found
          </h3>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Create a task to build routines and track your progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-3xl border shadow-xs flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => openTaskDetail(t)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                      {t.title}
                    </h3>
                    {t.requires_photo && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1"
                        style={{
                          backgroundColor: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <ImageIcon className="w-3 h-3" /> Photo Proof
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg hover:opacity-80"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-text)",
                    }}
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 rounded-lg hover:opacity-80"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-danger)",
                    }}
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Footer info */}
              <div
                className="pt-2 border-t flex items-center justify-between text-[11px]"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="capitalize flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {t.recurrence}
                    {t.target_time ? ` (${t.target_time})` : ""}
                  </span>
                  <span>
                    {t.total_completions} completions
                  </span>
                </div>

                <button
                  onClick={() => openTaskDetail(t)}
                  className="font-bold flex items-center gap-0.5 hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Detail <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && (
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
                  {detailTask.task.title}
                </h3>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Schedule: {detailTask.task.recurrence} at {detailTask.task.target_time || "anytime"}
                </p>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="p-1 rounded-full hover:opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailTask.task.description && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text)" }}>
                {detailTask.task.description}
              </p>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Completion History ({detailTask.history.length})
              </h4>

              {detailTask.history.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                  No completions recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {detailTask.history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: "var(--color-success)" }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <div>
                          <span className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
                            {formatDate(item.date)}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] block italic" style={{ color: "var(--color-text-muted)" }}>
                              &ldquo;{item.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>

                      {item.image_url && (
                        <button
                          onClick={() => {
                            setViewPhoto({
                              isOpen: true,
                              imageUrl: item.image_url,
                              taskTitle: detailTask.task.title,
                              notes: item.notes,
                              date: formatDate(item.date),
                            });
                          }}
                          className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border hover:opacity-90"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt="Proof"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: "var(--color-text)" }}>
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Morning jog, Read 20 pages"
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
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 30 minutes around the park"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-hidden border"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-text)",
                      borderColor: "var(--color-border)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-hidden border"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-text)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Days</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>

              {recurrence === "custom" && (
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--color-text)" }}>
                    Select Days
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((d, idx) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedDays.includes(idx) ? "shadow-xs" : "opacity-60"
                        }`}
                        style={{
                          backgroundColor: selectedDays.includes(idx)
                            ? "var(--color-primary)"
                            : "var(--color-surface-alt)",
                          color: selectedDays.includes(idx) ? "#ffffff" : "var(--color-text-muted)",
                        }}
                      >
                        {d[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Proof Toggle Rule */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer"
                style={{
                  backgroundColor: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
                onClick={() => setRequiresPhoto(!requiresPhoto)}
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold block" style={{ color: "var(--color-text)" }}>
                    Require Photo Proof
                  </span>
                  <span className="text-[11px] block" style={{ color: "var(--color-text-muted)" }}>
                    Offers optional photo verification when completing this task
                  </span>
                </div>

                <div
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    requiresPhoto ? "justify-end" : "justify-start"
                  }`}
                  style={{
                    backgroundColor: requiresPhoto ? "var(--color-primary)" : "var(--color-border)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs transition-all" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Photo Modal */}
      <ViewPhotoModal
        isOpen={viewPhoto.isOpen}
        onClose={() => setViewPhoto((p) => ({ ...p, isOpen: false }))}
        imageUrl={viewPhoto.imageUrl}
        taskTitle={viewPhoto.taskTitle}
        notes={viewPhoto.notes}
        date={viewPhoto.date}
      />
    </div>
  );
}
