"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reviewChange } from "../actions";

export default function ChangeReviewPanel({ changeId, canApprove, currentStatus, initialNotes, initialReviewStatus }: { changeId: string; canApprove: boolean; currentStatus: string; initialNotes: string; initialReviewStatus: string | null }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isOpen = currentStatus === "REQUESTED" || currentStatus === "REVIEWING";
  if (!canApprove || !isOpen) return null;

  async function submit(status: "APPROVED" | "REJECTED") {
    setIsSubmitting(true);
    setError("");
    try {
      await reviewChange(changeId, status, notes);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5">
      <h2 className="text-lg font-semibold">Review độc lập</h2>
      <p className="mt-1 text-sm text-slate-400">{initialReviewStatus ? `Review hiện tại: ${initialReviewStatus}. Bạn có thể cập nhật lại khi yêu cầu còn mở.` : "Đánh giá tác động, rollback và mức sẵn sàng trước khi duyệt."}</p>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={4} disabled={isSubmitting} className="mt-4 w-full rounded-md border border-slate-600 bg-slate-950 p-3 text-sm" placeholder="Ghi chú; bắt buộc khi từ chối" />
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => submit("APPROVED")} disabled={isSubmitting} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"><CheckCircle className="h-4 w-4" /> Duyệt</button>
        <button type="button" onClick={() => submit("REJECTED")} disabled={isSubmitting} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-red-700 px-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"><XCircle className="h-4 w-4" /> Từ chối</button>
      </div>
    </section>
  );
}
