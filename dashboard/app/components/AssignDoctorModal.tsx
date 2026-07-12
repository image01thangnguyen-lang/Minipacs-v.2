"use client";

import React, { useState } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";

type DoctorOption = {
  value: string;
  label: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  doctors: DoctorOption[];
  onAssign: (doctorId: string) => Promise<boolean>;
};

export default function AssignDoctorModal({ isOpen, onClose, doctors, onAssign }: Props) {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setIsSubmitting(true);
    try {
      const success = await onAssign(selectedDoctor);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] rounded-xl border border-vin-border bg-vin-shell text-vin-text shadow-2xl">
        <div className="flex items-center justify-between border-b border-vin-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <UserPlus className="h-5 w-5 text-vin-accent" />
            Gán Bác Sĩ
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-vin-muted transition hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-vin-text2">
              Chọn Bác Sĩ
            </label>
            <select
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
              className="w-full rounded-lg border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none transition focus:border-vin-accent focus:ring-1 focus:ring-vin-accent"
              required
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-vin-muted transition hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDoctor}
              className="flex items-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-vin-accent/20 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gán ca"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
