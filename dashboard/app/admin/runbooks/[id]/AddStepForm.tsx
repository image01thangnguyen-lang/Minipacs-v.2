"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addRunbookStep } from "../actions";

export default function AddStepForm({ runbookId, disabled }: { runbookId: string; disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRisky, setIsRisky] = useState(false);
  const [actionUrl, setActionUrl] = useState("");
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      await addRunbookStep(runbookId, title, description, isRisky, actionUrl, attested);
      setTitle(""); setDescription(""); setIsRisky(false); setActionUrl(""); setAttested(false); setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể thêm step.");
    } finally { setSubmitting(false); }
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} disabled={disabled} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-600 text-sm font-semibold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> {disabled ? "Đang có execution; không thể thêm step" : "Thêm step"}</button>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-md border border-slate-700 bg-slate-900/40 p-5">
      <h2 className="text-sm font-semibold">Thêm step mới</h2>
      <label className="block text-sm">Tiêu đề<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-3" /></label>
      <label className="block text-sm">Hướng dẫn<textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={5000} rows={4} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" /></label>
      <label className="block text-sm">Đường dẫn tác vụ nội bộ<input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} maxLength={300} placeholder="/admin/ops/health" className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-3" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isRisky} onChange={(event) => setIsRisky(event.target.checked)} /><span>Step nguy hiểm, bắt buộc xác nhận khi thực thi</span></label>
      <label className="flex items-start gap-2 rounded-md border border-amber-800 bg-amber-950/30 p-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" /><span>Không chứa PHI hoặc giá trị secret.</span></label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2"><button type="submit" disabled={submitting || !attested} className="h-9 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Lưu step</button><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md px-4 text-sm hover:bg-slate-800">Hủy</button></div>
    </form>
  );
}
