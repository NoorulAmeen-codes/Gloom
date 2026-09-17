"use client";

import React, { useState } from "react";
import { Camera, Upload, X, Check, Image as ImageIcon, Sparkles } from "lucide-react";

interface PhotoProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  onConfirm: (imageUrl: string | null, notes: string | null) => Promise<void>;
}

const PRESET_PROOF_PHOTOS = [
  {
    label: "Morning Run",
    url: "https://images.pexels.com/photos/15035577/pexels-photo-15035577.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    label: "Park Walk",
    url: "https://images.pexels.com/photos/24913608/pexels-photo-24913608.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    label: "Fitness Outdoor",
    url: "https://images.pexels.com/photos/5965907/pexels-photo-5965907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    label: "Serene Morning",
    url: "https://images.pexels.com/photos/35574315/pexels-photo-35574315.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];

export function PhotoProofModal({
  isOpen,
  onClose,
  taskTitle,
  onConfirm,
}: PhotoProofModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (includePhoto = true) => {
    setIsSubmitting(true);
    try {
      const finalImage = includePhoto ? (selectedImage || customUrl || null) : null;
      await onConfirm(finalImage, notes.trim() || null);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: "var(--color-text)" }}>
                Add Photo Proof
              </h3>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Optional proof for &ldquo;{taskTitle}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview / Picker */}
        <div className="space-y-3">
          {selectedImage ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border" style={{ borderColor: "var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Selected Proof"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:opacity-90"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface-alt)",
              }}
            >
              <Upload className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
              <div className="text-center">
                <span className="text-sm font-semibold block" style={{ color: "var(--color-text)" }}>
                  Upload a photo from your device
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Take a photo or choose from gallery
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          )}

          {/* Quick preset proof photos */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold block" style={{ color: "var(--color-text-muted)" }}>
              Or choose a sample proof photo:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_PROOF_PHOTOS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSelectedImage(preset.url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
                    selectedImage === preset.url ? "ring-2 scale-95" : "hover:opacity-80"
                  }`}
                  style={{
                    borderColor: "var(--color-border)",
                    boxShadow: selectedImage === preset.url ? "0 0 0 2px var(--color-primary)" : "none",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Notes input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold block" style={{ color: "var(--color-text-muted)" }}>
              Note or Reflection (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? (e.g. 30 mins around the park, felt energized)"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl outline-hidden transition-colors"
              style={{
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--color-surface-alt)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            Skip Photo & Complete
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 text-white flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "var(--color-primary)",
            }}
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
