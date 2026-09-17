"use client";

import React from "react";
import { X, Calendar, FileText } from "lucide-react";

interface ViewPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  taskTitle: string;
  notes?: string | null;
  date?: string | null;
}

export function ViewPhotoModal({
  isOpen,
  onClose,
  imageUrl,
  taskTitle,
  notes,
  date,
}: ViewPhotoModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transition-colors relative"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative aspect-4/3 w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={taskTitle}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
              {taskTitle}
            </h3>
            {date && (
              <span
                className="text-xs flex items-center gap-1 font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
            )}
          </div>

          {notes && (
            <div
              className="p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
              }}
            >
              <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
              <p>{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
