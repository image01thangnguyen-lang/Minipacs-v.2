"use client";

import { AlertTriangle, CheckCircle, ExternalLink, Play, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeStep, finishExecution, startExecution } from "../actions";

export type ExecutorLogEntry = {
  kind: "STEP_COMPLETED";
  stepId: string;
  stepOrder: number;
  stepTitle?: string;
  isRisky?: boolean;
  completedAt?: string;
};

type RunbookStep = { id: string; order: number; title: string; description: string; isRisky: boolean; actionUrl: string | null };
type ActiveExecution = { id: string; log: ExecutorLogEntry[]; executorName: string; canControl: boolean };

export default function RunbookExecutor({ runbookId, steps, activeExecution }: { runbookId: string; steps: RunbookStep[]; activeExecution: ActiveExecution | null }) {
  const router = useRouter();
  const [executionId, setExecutionId] = useState(activeExecution?.id || null);
  const [log, setLog] = useState<ExecutorLogEntry[]>(activeExecution?.log || []);
  const [riskyConfirmed, setRiskyConfirmed] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canControl = activeExecution?.canControl ?? true;

  const completedIds = new Set(log.map((entry) => entry.stepId));
  const currentStep = steps.find((step) => !completedIds.has(step.id)) || null;
  const completedCount = completedIds.size;
  const allDone = Boolean(executionId) && completedCount === steps.length;

  async function start() {
    setSubmitting(true); setError("");
    try { const id = await startExecution(runbookId); setExecutionId(id); setLog([]); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể khởi chạy runbook."); }
    finally { setSubmitting(false); }
  }

  async function markCurrentComplete() {
    if (!executionId || !currentStep) return;
    setSubmitting(true); setError("");
    try {
      await completeStep(executionId, currentStep.id, currentStep.isRisky ? riskyConfirmed : false);
      setLog((previous) => [...previous, { kind: "STEP_COMPLETED", stepId: currentStep.id, stepOrder: currentStep.order, stepTitle: currentStep.title, isRisky: currentStep.isRisky, completedAt: new Date().toISOString() }]);
      setRiskyConfirmed(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể hoàn thành step."); }
    finally { setSubmitting(false); }
  }

  async function finish(status: "COMPLETED" | "FAILED" | "ABORTED") {
    if (!executionId) return;
    setSubmitting(true); setError("");
    try { await finishExecution(executionId, status, outcomeNotes); setExecutionId(null); setLog([]); setOutcomeNotes(""); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể kết thúc execution."); }
    finally { setSubmitting(false); }
  }

  if (executionId && !canControl) {
    return <section className="rounded-md border border-blue-800 bg-blue-950/30 p-5"><h2 className="font-semibold text-blue-200">Execution đang được giữ bởi {activeExecution?.executorName}</h2><p className="mt-1 text-sm text-blue-300">Bạn có thể theo dõi tiến độ nhưng không thể hoàn thành hoặc kết thúc execution của người khác.</p><div className="mt-3 h-2 overflow-hidden rounded bg-slate-800"><div className="h-full bg-blue-500" style={{ width: `${steps.length ? (completedCount / steps.length) * 100 : 0}%` }} /></div><p className="mt-2 text-xs text-blue-300">{completedCount}/{steps.length} step hoàn thành</p></section>;
  }

  if (!executionId) {
    return <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5 text-center"><h2 className="font-semibold">Thực thi runbook</h2><p className="mt-1 text-sm text-slate-400">Mỗi step và xác nhận rủi ro sẽ được lưu vào audit trail.</p>{error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}<button type="button" onClick={start} disabled={submitting} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"><Play className="h-4 w-4" /> Bắt đầu</button></section>;
  }

  return (
    <section className="space-y-5 rounded-md border-2 border-cyan-800 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-cyan-300">Execution đang chạy</h2><span className="rounded bg-blue-950 px-2 py-1 text-xs text-blue-300">{completedCount}/{steps.length}</span></div>
      <div className="h-2 overflow-hidden rounded bg-slate-800"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${steps.length ? (completedCount / steps.length) * 100 : 0}%` }} /></div>

      {log.length > 0 && <div className="space-y-1">{log.map((entry) => <div key={entry.stepId} className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle className="h-4 w-4" /><span>Step {entry.stepOrder}: {entry.stepTitle || "Đã hoàn thành"}</span>{entry.isRisky && <span className="rounded bg-amber-950 px-1 text-xs text-amber-300">đã xác nhận rủi ro</span>}</div>)}</div>}

      {currentStep && (
        <div className={`rounded-md border-2 p-5 ${currentStep.isRisky ? "border-amber-700 bg-amber-950/20" : "border-slate-700 bg-slate-950"}`}>
          <div className="flex flex-wrap items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold">{currentStep.order}</span><h3 className="font-semibold">{currentStep.title}</h3>{currentStep.isRisky && <span className="inline-flex items-center gap-1 rounded bg-amber-900 px-1.5 py-0.5 text-xs text-amber-200"><AlertTriangle className="h-3 w-3" /> Nguy hiểm</span>}</div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{currentStep.description}</p>
          {currentStep.actionUrl && <Link href={currentStep.actionUrl} className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"><ExternalLink className="h-4 w-4" /> Mở tác vụ liên quan</Link>}
          {currentStep.isRisky && <div className="mt-4 flex gap-3 rounded-md border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><label className="flex items-start gap-2"><input type="checkbox" checked={riskyConfirmed} onChange={(event) => setRiskyConfirmed(event.target.checked)} className="mt-1" /><span>Tôi hiểu rủi ro và xác nhận step này đã được thực hiện đúng.</span></label></div>}
          <button type="button" onClick={markCurrentComplete} disabled={submitting || (currentStep.isRisky && !riskyConfirmed)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle className="h-4 w-4" /> Hoàn thành step</button>
        </div>
      )}

      {allDone && <div className="py-2 text-center text-emerald-400"><CheckCircle className="mx-auto mb-2 h-9 w-9" /><strong>Tất cả step đã hoàn thành</strong></div>}
      <label className="block text-sm text-slate-300">Ghi chú kết thúc <span className="text-slate-500">(bắt buộc khi Failed/Abort)</span><textarea value={outcomeNotes} onChange={(event) => setOutcomeNotes(event.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3 border-t border-slate-700 pt-4"><button type="button" onClick={() => finish("COMPLETED")} disabled={!allDone || submitting} className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle className="h-4 w-4" /> Hoàn tất</button><button type="button" onClick={() => finish("FAILED")} disabled={submitting || outcomeNotes.trim().length < 5} className="inline-flex h-9 items-center gap-2 rounded-md bg-red-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><XCircle className="h-4 w-4" /> Failed</button><button type="button" onClick={() => finish("ABORTED")} disabled={submitting || outcomeNotes.trim().length < 5} className="h-9 rounded-md border border-amber-700 px-3 text-sm font-semibold text-amber-300 disabled:opacity-50">Abort</button></div>
    </section>
  );
}
