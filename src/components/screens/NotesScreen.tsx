"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Image as ImageIcon, Sparkles, X, Check, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface QuoteItem {
  id: number;
  text: string;
  author: string | null;
  background_image_url: string;
  created_at: string;
}

const PRESET_BACKGROUNDS = [
  {
    name: "Misty Alpine Summit",
    url: "https://images.pexels.com/photos/28253371/pexels-photo-28253371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
  {
    name: "Snow Clouds Peak",
    url: "https://images.pexels.com/photos/17077984/pexels-photo-17077984.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
  {
    name: "Moody Fog Range",
    url: "https://images.pexels.com/photos/28210215/pexels-photo-28210215.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
  {
    name: "Dramatic Ridge",
    url: "https://images.pexels.com/photos/14546363/pexels-photo-14546363.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
  {
    name: "Dark Horizon",
    url: "https://images.pexels.com/photos/28210209/pexels-photo-28210209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
  {
    name: "Glacier Fog",
    url: "https://images.pexels.com/photos/11001205/pexels-photo-11001205.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  },
];

export function NotesScreen() {
  const { formatDate } = useApp();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"stories" | "manage">("stories");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("down");

  // Touch swipe handling for Y-axis slide down/up
  const touchStartY = useRef<number | null>(null);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [formText, setFormText] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formBg, setFormBg] = useState(PRESET_BACKGROUNDS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes");
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handlePrev = useCallback(() => {
    setSlideDirection("up");
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : quotes.length - 1));
  }, [quotes.length]);

  const handleNext = useCallback(() => {
    setSlideDirection("down");
    setCurrentIndex((prev) => (prev < quotes.length - 1 ? prev + 1 : 0));
  }, [quotes.length]);

  // Touch gestures for vertical swipe down/up
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped UP -> Next quote (slides down into view)
        handleNext();
      } else {
        // Swiped DOWN -> Prev quote
        handlePrev();
      }
    }
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen || viewMode !== "stories") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, viewMode, handleNext, handlePrev]);

  const openAddModal = () => {
    setEditingQuote(null);
    setFormText("");
    setFormAuthor("");
    setFormBg(PRESET_BACKGROUNDS[0].url);
    setModalOpen(true);
  };

  const openEditModal = (q: QuoteItem) => {
    setEditingQuote(q);
    setFormText(q.text);
    setFormAuthor(q.author || "");
    setFormBg(q.background_image_url);
    setModalOpen(true);
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingQuote) {
        const res = await fetch(`/api/quotes/${editingQuote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: formText,
            author: formAuthor,
            background_image_url: formBg,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setQuotes((prev) =>
            prev.map((q) => (q.id === editingQuote.id ? data.quote : q))
          );
          setModalOpen(false);
        }
      } else {
        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: formText,
            author: formAuthor,
            background_image_url: formBg,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setQuotes((prev) => [data.quote, ...prev]);
          setModalOpen(false);
          setCurrentIndex(0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        if (currentIndex >= quotes.length - 1) {
          setCurrentIndex(Math.max(0, quotes.length - 2));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormBg(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentQuote = quotes[currentIndex];

  return (
    <div className="space-y-4 pb-24 lg:pb-12 animate-in fade-in duration-300">
      {/* Header bar matching Image 1: Motivation Notes with Stories / Manage toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--color-text)" }}>
            Motivation
          </h1>
          <h2 className="text-2xl font-black tracking-tight -mt-1" style={{ color: "var(--color-text)" }}>
            Notes
          </h2>
        </div>

        {/* View Mode Toggle Pill matching Image 1 */}
        <div
          className="flex items-center p-1 rounded-2xl border bg-white"
          style={{
            borderColor: "var(--color-border, #e2e8f0)",
          }}
        >
          <button
            onClick={() => setViewMode("stories")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "stories" ? "shadow-xs" : "hover:opacity-80"
            }`}
            style={{
              backgroundColor: viewMode === "stories" ? "var(--color-surface-alt, #f1f5f9)" : "transparent",
              color: viewMode === "stories" ? "var(--color-text, #0f172a)" : "var(--color-text-muted, #64748b)",
              border: viewMode === "stories" ? "1px solid var(--color-border, #e2e8f0)" : "1px solid transparent",
            }}
          >
            Stories
          </button>
          <button
            onClick={() => setViewMode("manage")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "manage" ? "shadow-xs" : "hover:opacity-80"
            }`}
            style={{
              backgroundColor: viewMode === "manage" ? "var(--color-surface-alt, #f1f5f9)" : "transparent",
              color: viewMode === "manage" ? "var(--color-text, #0f172a)" : "var(--color-text-muted, #64748b)",
              border: viewMode === "manage" ? "1px solid var(--color-border, #e2e8f0)" : "1px solid transparent",
            }}
          >
            Manage
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
          Loading daily inspiration...
        </div>
      ) : quotes.length === 0 ? (
        <div
          className="p-12 rounded-3xl text-center space-y-4 border"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Sparkles className="w-12 h-12 mx-auto" style={{ color: "var(--color-primary)" }} />
          <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
            No Quotes Yet
          </h3>
          <p className="text-xs max-w-xs mx-auto" style={{ color: "var(--color-text-muted)" }}>
            Inspire your habit journey with words from thinkers, mentors, or yourself.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus className="w-4 h-4" /> Add Your First Quote
          </button>
        </div>
      ) : viewMode === "stories" ? (
        /* Stories View matching Image 1 with vertical slide-down / Y-axis queue */
        <div className="space-y-4">
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="relative rounded-3xl overflow-hidden shadow-xl aspect-9/14 sm:aspect-4/5 max-h-[72vh] flex flex-col justify-center items-center text-center p-8 select-none transition-all"
            style={{
              backgroundImage: `url(${currentQuote?.background_image_url || PRESET_BACKGROUNDS[0].url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Subtle dark gradient overlay so text remains razor sharp */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/75 pointer-events-none" />

            {/* Quote Counter indicator top */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 z-10 px-6">
              {quotes.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSlideDirection(idx > currentIndex ? "down" : "up");
                    setCurrentIndex(idx);
                  }}
                  className={`h-1 rounded-full cursor-pointer transition-all ${
                    idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Vertical Slide Hint Pill / Controls */}
            <div className="absolute top-8 right-4 z-20 flex flex-col gap-1.5">
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-transform active:scale-90 border border-white/20"
                title="Slide up (Previous)"
                aria-label="Previous quote"
              >
                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-transform active:scale-90 border border-white/20"
                title="Slide down (Next)"
                aria-label="Next quote"
              >
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Left Nav Arrow Button (from wireframe image) */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-transform active:scale-90 border border-white/20"
              aria-label="Previous quote"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Right Nav Arrow Button (from wireframe image) */}
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-transform active:scale-90 border border-white/20"
              aria-label="Next quote"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Quote Body with Y-axis Slide-Down Animation */}
            <div
              key={currentQuote?.id}
              className={`relative z-10 max-w-md mx-auto space-y-4 px-6 animate-in duration-300 ${
                slideDirection === "down" ? "slide-in-from-top-6" : "slide-in-from-bottom-6"
              } fade-in`}
            >
              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight drop-shadow-md">
                &ldquo;{currentQuote?.text}&rdquo;
              </h3>
              {currentQuote?.author && (
                <p className="text-sm font-semibold text-white/85 tracking-wide drop-shadow-xs">
                  — {currentQuote.author}
                </p>
              )}
            </div>

            {/* Bottom mini actions in story */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-10 text-white/70 text-xs">
              <span className="font-medium drop-shadow-xs flex items-center gap-1">
                <span>{currentIndex + 1} of {quotes.length}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">(Swipe vertical or use arrows)</span>
              </span>
              <button
                onClick={openAddModal}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Quote
              </button>
            </div>
          </div>

          {/* Quick queue switcher / thumbnails below story (Y-axis queue selector) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quotes.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setSlideDirection(idx > currentIndex ? "down" : "up");
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 w-14 h-18 rounded-xl overflow-hidden border-2 transition-transform ${
                  idx === currentIndex ? "scale-105" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  borderColor: idx === currentIndex ? "var(--color-primary)" : "transparent",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.background_image_url}
                  alt={q.author || "Quote"}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Manage View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {quotes.length} saved motivation notes
            </p>
            <button
              onClick={openAddModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1 shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add New Quote
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border flex gap-3 items-center justify-between transition-colors shadow-xs"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.background_image_url}
                    alt={q.author || "Quote"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold line-clamp-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    &ldquo;{q.text}&rdquo;
                  </p>
                  {q.author && (
                    <p
                      className="text-[11px] font-medium mt-0.5 truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      — {q.author}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-2 rounded-lg hover:opacity-80 transition-colors"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-text)",
                    }}
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuote(q.id)}
                    className="p-2 rounded-lg hover:opacity-80 transition-colors"
                    style={{
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-danger)",
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Quote Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base" style={{ color: "var(--color-text)" }}>
                  {editingQuote ? "Edit Quote" : "Add Motivation Quote"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
                  Quote Text *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="The only way to do great work is to love what you do."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors font-medium"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text)" }}>
                  Author (Optional)
                </label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Steve Jobs"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
                  style={{
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: "var(--color-text)" }}>
                  Background Image
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_BACKGROUNDS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormBg(preset.url)}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all ${
                        formBg === preset.url ? "ring-2 scale-95" : "hover:opacity-85"
                      }`}
                      style={{
                        borderColor: formBg === preset.url ? "var(--color-primary)" : "var(--color-border)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      {formBg === preset.url && (
                        <div
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className="flex-1 py-2 px-3 rounded-xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-colors"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-surface-alt)",
                      color: "var(--color-text)",
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                    Upload Custom Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCustomUpload}
                    />
                  </label>
                </div>
              </div>

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
                  disabled={isSubmitting || !formText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : editingQuote ? "Update Quote" : "Save Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
