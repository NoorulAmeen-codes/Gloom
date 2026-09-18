"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  X,
  Check,
  Upload,
  ArrowUpDown,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface QuoteItem {
  id: number;
  text: string;
  author: string | null;
  background_image_url: string;
  sort_order?: number;
  created_at?: string;
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
  const { quotes, quotesLoading, setQuotes } = useApp();

  // --------------------------------------------------
  // View
  // --------------------------------------------------

  const [viewMode, setViewMode] = useState<"stories" | "manage">("stories");

  // --------------------------------------------------
  // Rearrange
  // --------------------------------------------------

  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [draggedQuoteId, setDraggedQuoteId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // --------------------------------------------------
  // Add / Edit Modal
  // --------------------------------------------------

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [formText, setFormText] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formBg, setFormBg] = useState(PRESET_BACKGROUNDS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------
  // Save Quote Order
  // --------------------------------------------------

  const saveQuoteOrder = async (newQuotes: QuoteItem[]) => {
    const order = newQuotes.map((quote, index) => ({
      id: quote.id,
      sort_order: index,
    }));

    setSavingOrder(true);

    try {
      const res = await fetch("/api/quotes/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order }),
      });

      if (!res.ok) {
        throw new Error("Failed to save quote order");
      }

      // Keep sort_order synchronized locally
      setQuotes((prev) =>
        prev.map((quote) => {
          const updated = order.find((item) => item.id === quote.id);

          return updated
            ? {
                ...quote,
                sort_order: updated.sort_order,
              }
            : quote;
        })
      );
    } catch (error) {
      console.error("Failed to save quote order:", error);
    } finally {
      setSavingOrder(false);
    }
  };

  // --------------------------------------------------
  // Drag & Drop
  // --------------------------------------------------

  const handleDragStart = (id: number) => {
    if (!rearrangeMode || savingOrder) return;

    setDraggedQuoteId(id);
  };

  const handleDragEnd = () => {
    setDraggedQuoteId(null);
  };

  const handleDrop = async (targetId: number) => {
    if (
      !rearrangeMode ||
      savingOrder ||
      draggedQuoteId === null ||
      draggedQuoteId === targetId
    ) {
      setDraggedQuoteId(null);
      return;
    }

    const oldIndex = quotes.findIndex(
      (quote) => quote.id === draggedQuoteId
    );

    const newIndex = quotes.findIndex(
      (quote) => quote.id === targetId
    );

    if (oldIndex === -1 || newIndex === -1) {
      setDraggedQuoteId(null);
      return;
    }

    const newQuotes = [...quotes];

    const [movedQuote] = newQuotes.splice(oldIndex, 1);

    newQuotes.splice(newIndex, 0, movedQuote);

    const reorderedQuotes = newQuotes.map((quote, index) => ({
      ...quote,
      sort_order: index,
    }));

    setQuotes(reorderedQuotes);
    setDraggedQuoteId(null);

    await saveQuoteOrder(reorderedQuotes);
  };

  // --------------------------------------------------
  // Mobile / Button Reordering
  // --------------------------------------------------

  const moveQuote = async (
    quoteId: number,
    direction: "up" | "down"
  ) => {
    if (!rearrangeMode || savingOrder) return;

    const currentIndex = quotes.findIndex(
      (quote) => quote.id === quoteId
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= quotes.length
    ) {
      return;
    }

    const newQuotes = [...quotes];

    const [movedQuote] = newQuotes.splice(currentIndex, 1);

    newQuotes.splice(targetIndex, 0, movedQuote);

    const reorderedQuotes = newQuotes.map((quote, index) => ({
      ...quote,
      sort_order: index,
    }));

    setQuotes(reorderedQuotes);

    await saveQuoteOrder(reorderedQuotes);
  };

  // --------------------------------------------------
  // Add Quote
  // --------------------------------------------------

  const openAddModal = () => {
    setEditingQuote(null);
    setFormText("");
    setFormAuthor("");
    setFormBg(PRESET_BACKGROUNDS[0].url);
    setModalOpen(true);
  };

  // --------------------------------------------------
  // Edit Quote
  // --------------------------------------------------

  const openEditModal = (quote: QuoteItem) => {
    setEditingQuote(quote);
    setFormText(quote.text);
    setFormAuthor(quote.author || "");
    setFormBg(quote.background_image_url);
    setModalOpen(true);
  };

  // --------------------------------------------------
  // Close Modal
  // --------------------------------------------------

  const closeModal = () => {
    if (isSubmitting) return;

    setModalOpen(false);
    setEditingQuote(null);
  };

  // --------------------------------------------------
  // Save Quote
  // --------------------------------------------------

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanText = formText.trim();
    const cleanAuthor = formAuthor.trim();

    if (!cleanText || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // ----------------------------------------------
      // EDIT EXISTING QUOTE
      // ----------------------------------------------

      if (editingQuote) {
        const res = await fetch(
          `/api/quotes/${editingQuote.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: cleanText,
              author: cleanAuthor || null,
              background_image_url: formBg,
            }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to update quote");
        }

        const data = await res.json();

        setQuotes((prev) =>
          prev.map((quote) =>
            quote.id === editingQuote.id
              ? data.quote
              : quote
          )
        );

        closeModal();

        return;
      }

      // ----------------------------------------------
      // CREATE NEW QUOTE
      // ----------------------------------------------

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          author: cleanAuthor || null,
          background_image_url: formBg,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create quote");
      }

      const data = await res.json();

      setQuotes((prev) => [...prev, data.quote]);

      closeModal();
    } catch (error) {
      console.error("Failed to save quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // Delete Quote
  // --------------------------------------------------

  const handleDeleteQuote = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quote?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete quote");
      }

      setQuotes((prev) =>
        prev.filter((quote) => quote.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete quote:", error);
    }
  };

  // --------------------------------------------------
  // Custom Image Upload
  // --------------------------------------------------

  const handleCustomUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setFormBg(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="space-y-4 pb-24 lg:pb-12 animate-in fade-in duration-300">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{
              color: "var(--color-text)",
            }}
          >
            Motivation
          </h1>

          <h2
            className="text-2xl font-black tracking-tight -mt-1"
            style={{
              color: "var(--color-text)",
            }}
          >
            Notes
          </h2>
        </div>

        {/* View Mode Toggle */}

        <div
          className="flex items-center p-1 rounded-2xl border bg-white shrink-0"
          style={{
            borderColor:
              "var(--color-border, #e2e8f0)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setViewMode("stories");
              setRearrangeMode(false);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "stories"
                ? "shadow-xs"
                : "hover:opacity-80"
            }`}
            style={{
              backgroundColor:
                viewMode === "stories"
                  ? "var(--color-surface-alt, #f1f5f9)"
                  : "transparent",
              color:
                viewMode === "stories"
                  ? "var(--color-text, #0f172a)"
                  : "var(--color-text-muted, #64748b)",
              border:
                viewMode === "stories"
                  ? "1px solid var(--color-border, #e2e8f0)"
                  : "1px solid transparent",
            }}
          >
            Stories
          </button>

          <button
            type="button"
            onClick={() => setViewMode("manage")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "manage"
                ? "shadow-xs"
                : "hover:opacity-80"
            }`}
            style={{
              backgroundColor:
                viewMode === "manage"
                  ? "var(--color-surface-alt, #f1f5f9)"
                  : "transparent",
              color:
                viewMode === "manage"
                  ? "var(--color-text, #0f172a)"
                  : "var(--color-text-muted, #64748b)",
              border:
                viewMode === "manage"
                  ? "1px solid var(--color-border, #e2e8f0)"
                  : "1px solid transparent",
            }}
          >
            Manage
          </button>
        </div>
      </div>

      {/* ==================================================
          LOADING
      ================================================== */}

      {quotesLoading ? (
        <div
          className="py-24 text-center text-sm"
          style={{
            color: "var(--color-text-muted)",
          }}
        >
          Loading daily inspiration...
        </div>
      ) : quotes.length === 0 ? (

        /* ==================================================
           EMPTY STATE
        ================================================== */

        <div
          className="p-12 rounded-3xl text-center space-y-4 border"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Sparkles
            className="w-12 h-12 mx-auto"
            style={{
              color: "var(--color-primary)",
            }}
          />

          <h3
            className="font-bold text-lg"
            style={{
              color: "var(--color-text)",
            }}
          >
            No Quotes Yet
          </h3>

          <p
            className="text-xs max-w-xs mx-auto"
            style={{
              color: "var(--color-text-muted)",
            }}
          >
            Inspire your habit journey with words from
            thinkers, mentors, or yourself.
          </p>

          <button
            type="button"
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
            style={{
              backgroundColor: "var(--color-primary)",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Your First Quote
          </button>
        </div>

      ) : viewMode === "stories" ? (

        /* ==================================================
           STORIES VIEW
        ================================================== */

        <div className="space-y-3">

          <div className="max-h-[520px] overflow-y-auto overflow-x-hidden space-y-3 pr-1 scrollbar-none">

            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="relative h-[115px] w-full overflow-hidden rounded-2xl shadow-sm"
                style={{
                  backgroundImage: `url(${quote.background_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >

                {/* Dark overlay */}

                <div className="absolute inset-0 bg-black/45" />

                {/* Quote content */}

                <div className="relative z-10 flex h-full flex-col justify-center px-5 py-3">

                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug tracking-tight drop-shadow-md line-clamp-3">
                    &ldquo;{quote.text}&rdquo;
                  </h3>

                  {quote.author && (
                    <p className="mt-1.5 text-xs font-medium text-white/85 tracking-wide drop-shadow-sm">
                      — {quote.author}
                    </p>
                  )}

                </div>
              </div>
            ))}

          </div>

          {/* Add Quote */}

          <button
            type="button"
            onClick={openAddModal}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            <Plus className="w-4 h-4" />
            Add Quote
          </button>

        </div>

      ) : (

        /* ==================================================
           MANAGE VIEW
        ================================================== */

        <div className="space-y-4">

          {/* Manage Header */}

          <div className="flex items-center justify-between gap-3">

            <div>
              <h2
                className="text-lg font-black"
                style={{
                  color: "var(--color-text)",
                }}
              >
                Manage Motivation Notes
              </h2>

              <p
                className="text-xs mt-1"
                style={{
                  color: "var(--color-text-muted)",
                }}
              >
                {quotes.length} saved motivation{" "}
                {quotes.length === 1 ? "note" : "notes"}
              </p>

              {rearrangeMode && (
                <p
                  className="text-[11px] mt-1"
                  style={{
                    color: "var(--color-primary)",
                  }}
                >
                  {savingOrder
                    ? "Saving order..."
                    : "Drag notes or use the arrows to rearrange."}
                </p>
              )}
            </div>

           
            {/* Rearrange + Add New */}

<div className="flex items-center gap-2 shrink-0">
  <button
    type="button"
    onClick={() => setRearrangeMode((prev) => !prev)}
    disabled={savingOrder}
    className="px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
    style={{
      backgroundColor: rearrangeMode
        ? "var(--color-primary)"
        : "var(--color-surface-alt)",
      color: rearrangeMode
        ? "white"
        : "var(--color-text)",
      border: rearrangeMode
        ? "1px solid var(--color-primary)"
        : "1px solid var(--color-border)",
    }}
    title={
      rearrangeMode
        ? "Finish rearranging"
        : "Rearrange motivation notes"
    }
  >
    <ArrowUpDown className="w-3.5 h-3.5" />

    {rearrangeMode ? "Done" : "Rearrange"}
  </button>

  <button
    type="button"
    onClick={openAddModal}
    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-xs shrink-0"
    style={{
      backgroundColor: "var(--color-primary)",
    }}
  >
    <Plus className="w-3.5 h-3.5" />
    Add New
  </button>
</div>

          </div>

          {/* Quote List */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {quotes.map((quote, index) => (
              <div
                key={quote.id}
                draggable={rearrangeMode && !savingOrder}
                onDragStart={() =>
                  handleDragStart(quote.id)
                }
                onDragOver={(e) => {
                  if (rearrangeMode && !savingOrder) {
                    e.preventDefault();
                  }
                }}
                onDrop={() => {
                  if (rearrangeMode && !savingOrder) {
                    void handleDrop(quote.id);
                  }
                }}
                onDragEnd={handleDragEnd}
                className="p-4 rounded-2xl border flex gap-3 items-center justify-between transition-all shadow-xs"
                style={{
                  backgroundColor:
                    "var(--color-surface)",
                  borderColor:
                    draggedQuoteId === quote.id
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  opacity:
                    draggedQuoteId === quote.id
                      ? 0.5
                      : 1,
                  cursor: rearrangeMode
                    ? "grab"
                    : "default",
                }}
              >

                {/* Drag Handle */}

                {rearrangeMode && (
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      color:
                        "var(--color-text-muted)",
                    }}
                    title="Drag to rearrange"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}

                {/* Background Image */}

                <div
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border"
                  style={{
                    borderColor:
                      "var(--color-border)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={quote.background_image_url}
                    alt={quote.author || "Quote"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quote Information */}

                <div className="flex-1 min-w-0">

                  <p
                    className="text-xs font-bold line-clamp-2"
                    style={{
                      color: "var(--color-text)",
                    }}
                  >
                    &ldquo;{quote.text}&rdquo;
                  </p>

                  {quote.author && (
                    <p
                      className="text-[11px] font-medium mt-0.5 truncate"
                      style={{
                        color:
                          "var(--color-text-muted)",
                      }}
                    >
                      — {quote.author}
                    </p>
                  )}

                </div>

                {/* Rearrange Controls */}

                {rearrangeMode ? (
                  <div className="flex items-center gap-1 shrink-0">

                    <button
                      type="button"
                      disabled={
                        savingOrder || index === 0
                      }
                      onClick={() =>
                        void moveQuote(
                          quote.id,
                          "up"
                        )
                      }
                      className="p-2 rounded-lg transition-colors disabled:opacity-30"
                      style={{
                        backgroundColor:
                          "var(--color-surface-alt)",
                        color:
                          "var(--color-text)",
                      }}
                      title="Move up"
                      aria-label="Move quote up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={
                        savingOrder ||
                        index === quotes.length - 1
                      }
                      onClick={() =>
                        void moveQuote(
                          quote.id,
                          "down"
                        )
                      }
                      className="p-2 rounded-lg transition-colors disabled:opacity-30"
                      style={{
                        backgroundColor:
                          "var(--color-surface-alt)",
                        color:
                          "var(--color-text)",
                      }}
                      title="Move down"
                      aria-label="Move quote down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                  </div>
                ) : (

                  /* Edit / Delete */

                  <div className="flex items-center gap-1 shrink-0">

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(quote)
                      }
                      className="p-2 rounded-lg hover:opacity-80 transition-colors"
                      style={{
                        backgroundColor:
                          "var(--color-surface-alt)",
                        color:
                          "var(--color-text)",
                      }}
                      title="Edit"
                      aria-label="Edit quote"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDeleteQuote(
                          quote.id
                        )
                      }
                      className="p-2 rounded-lg hover:opacity-80 transition-colors"
                      style={{
                        backgroundColor:
                          "var(--color-surface-alt)",
                        color:
                          "var(--color-danger)",
                      }}
                      title="Delete"
                      aria-label="Delete quote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>

          {/* Rearrange Status */}

          {rearrangeMode && (
            <div
              className="rounded-xl border px-4 py-3 text-xs"
              style={{
                backgroundColor:
                  "var(--color-surface-alt)",
                borderColor:
                  "var(--color-border)",
                color:
                  "var(--color-text-muted)",
              }}
            >
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 shrink-0" />

                <span>
                  {savingOrder
                    ? "Saving your new order..."
                    : "On desktop, drag a note. On mobile, use the ↑ and ↓ buttons."}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor:
                "var(--color-surface)",
              border:
                "1px solid var(--color-border)",
            }}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="flex items-center justify-between gap-3">

              <div>
                <h2
                  className="text-lg font-black"
                  style={{
                    color: "var(--color-text)",
                  }}
                >
                  {editingQuote
                    ? "Edit Motivation Note"
                    : "Add Motivation Note"}
                </h2>

                <p
                  className="text-xs mt-1"
                  style={{
                    color:
                      "var(--color-text-muted)",
                  }}
                >
                  {editingQuote
                    ? "Update your motivation note."
                    : "Create a new motivation note."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-2 rounded-xl hover:opacity-80 disabled:opacity-40 shrink-0"
                style={{
                  backgroundColor:
                    "var(--color-surface-alt)",
                  color:
                    "var(--color-text-muted)",
                }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* Modal Form */}

            <form
              onSubmit={handleSaveQuote}
              className="space-y-4"
            >

              {/* Quote Text */}

              <div>
                <label
                  className="text-xs font-bold block mb-1"
                  style={{
                    color: "var(--color-text)",
                  }}
                >
                  Quote Text *
                </label>

                <textarea
                  required
                  rows={3}
                  value={formText}
                  onChange={(e) =>
                    setFormText(e.target.value)
                  }
                  placeholder="The only way to do great work is to love what you do."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors font-medium"
                  style={{
                    backgroundColor:
                      "var(--color-surface-alt)",
                    color:
                      "var(--color-text)",
                    borderColor:
                      "var(--color-border)",
                  }}
                />
              </div>

              {/* Author */}

              <div>
                <label
                  className="text-xs font-bold block mb-1"
                  style={{
                    color: "var(--color-text)",
                  }}
                >
                  Author (Optional)
                </label>

                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) =>
                    setFormAuthor(e.target.value)
                  }
                  placeholder="Steve Jobs"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-hidden border transition-colors"
                  style={{
                    backgroundColor:
                      "var(--color-surface-alt)",
                    color:
                      "var(--color-text)",
                    borderColor:
                      "var(--color-border)",
                  }}
                />
              </div>

              {/* Background Image */}

              <div>

                <label
                  className="text-xs font-bold block mb-2"
                  style={{
                    color: "var(--color-text)",
                  }}
                >
                  Background Image
                </label>

                {/* Preset Images */}

                <div className="grid grid-cols-3 gap-2 mb-3">

                  {PRESET_BACKGROUNDS.map(
                    (preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setFormBg(
                            preset.url
                          )
                        }
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                          formBg === preset.url
                            ? "ring-2 scale-95"
                            : "hover:opacity-85"
                        } disabled:opacity-50`}
                        style={{
                          borderColor:
                            formBg ===
                            preset.url
                              ? "var(--color-primary)"
                              : "var(--color-border)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />

                        {formBg ===
                          preset.url && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    )
                  )}

                </div>

                {/* Custom Upload */}

                <div className="flex items-center gap-2">

                  <label
                    className="flex-1 py-2 px-3 rounded-xl border border-dashed flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-colors"
                    style={{
                      borderColor:
                        "var(--color-border)",
                      backgroundColor:
                        "var(--color-surface-alt)",
                      color:
                        "var(--color-text)",
                    }}
                  >
                    <Upload
                      className="w-3.5 h-3.5"
                      style={{
                        color:
                          "var(--color-primary)",
                      }}
                    />

                    Upload Custom Image

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={
                        handleCustomUpload
                      }
                    />
                  </label>

                </div>

              </div>

              {/* Buttons */}

              <div className="flex items-center gap-2 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor:
                      "var(--color-surface-alt)",
                    color:
                      "var(--color-text-muted)",
                    border:
                      "1px solid var(--color-border)",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formText.trim()
                  }
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor:
                      "var(--color-primary)",
                  }}
                >
                  <Check className="w-4 h-4" />

                  {isSubmitting
                    ? "Saving..."
                    : editingQuote
                    ? "Update Quote"
                    : "Save Quote"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}