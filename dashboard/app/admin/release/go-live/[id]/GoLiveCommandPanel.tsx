"use client";

import { AlertTriangle, CheckCircle, ShieldAlert, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reopenRelease, signOffRelease, transitionRelease } from "../actions";

export type SignOffView = { role: string; status: string; notes?: string | null; evidenceUrl?: string | null; signedAt?: string | null; signedByName?: string | null };
type ReadinessBlockers = { incidents: number; securityFindings: number; uatFailures: number; uatPending: number; uatMissing: number; staleChecks: number; highKnownIssues: number; handoffIncomplete: number };

export default function GoLiveCommandPanel({ releaseId, version, roles, signOffs, canSignOff, canManage, currentStatus, blockers }: { releaseId: string; version: string; roles: string[]; signOffs: Record<string, SignOffView>; canSignOff: boolean; canManage: boolean; currentStatus: string; blockers: ReadinessBlockers }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [attested, setAttested] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const blockerCount = Object.values(blockers).reduce((sum, count) => sum + count, 0);

  async function submitSignOff(status: "APPROVED" | "REJECTED") {
    if (!activeRole) return;
    setSubmitting(true); setError("");
    try { await signOffRelease(releaseId, activeRole, status, notes, evidenceUrl, attested); setActiveRole(null); setNotes(""); setEvidenceUrl(""); setAttested(false); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu sign-off."); }
    finally { setSubmitting(false); }
  }

  async function transition(status: string) {
    setSubmitting(true); setError("");
    try { await transitionRelease(releaseId, status, reason, confirmation); setReason(""); setConfirmation(""); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể chuyển trạng thái."); }
    finally { setSubmitting(false); }
  }

  async function reopen() {
    setSubmitting(true); setError("");
    try { await reopenRelease(releaseId, reason); setReason(""); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể reopen release."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(role => {
          const signoff = signOffs[role];
          return (
            <div key={role} className={`rounded-md border p-4 ${signoff.status === "APPROVED" ? "border-emerald-800 bg-emerald-950/20" : signoff.status === "REJECTED" ? "border-red-800 bg-red-950/20" : "border-slate-700"}`}>
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{role}</h3><span className="rounded bg-slate-800 px-2 py-0.5 text-sm">{signoff.status}</span></div>
              {signoff.signedByName && <p className="mt-2 text-sm text-slate-400">{signoff.signedByName}{signoff.signedAt ? ` - ${new Date(signoff.signedAt).toLocaleString("vi-VN")}` : ""}</p>}
              {signoff.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{signoff.notes}</p>}
              {signoff.evidenceUrl && <a href={signoff.evidenceUrl} className="mt-2 block text-sm text-cyan-400 hover:text-cyan-300">Mở evidence</a>}
              {canSignOff && currentStatus === "READY_FOR_SIGNOFF" && (activeRole === role ? (
                <div className="mt-3 space-y-2">
                  <textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={3000} rows={3} placeholder="Nhận xét bắt buộc" className="w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm" />
                  <input value={evidenceUrl} onChange={event => setEvidenceUrl(event.target.value)} maxLength={500} placeholder="Evidence URL nội bộ hoặc HTTPS" className="h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2 text-sm" />
                  <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={attested} onChange={event => setAttested(event.target.checked)} className="mt-0.5" /><span>Tôi đã kiểm tra evidence, readiness và hiểu trách nhiệm ký.</span></label>
                  <div className="flex gap-2"><button type="button" onClick={() => submitSignOff("APPROVED")} disabled={submitting || !attested || notes.trim().length < 1} className="h-8 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Duyệt</button><button type="button" onClick={() => submitSignOff("REJECTED")} disabled={submitting || !attested || notes.trim().length < 1} className="h-8 rounded-md bg-red-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Từ chối</button><button type="button" onClick={() => setActiveRole(null)} className="h-8 px-2 text-sm">Hủy</button></div>
                </div>
              ) : <button type="button" onClick={() => { setActiveRole(role); setNotes(signoff.notes || ""); setEvidenceUrl(signoff.evidenceUrl || ""); }} className="mt-3 h-8 w-full rounded-md border border-slate-600 text-sm hover:bg-slate-800">Ký vai trò này</button>)}
            </div>
          );
        })}
      </div>

      {blockerCount > 0 && <div className="flex gap-3 rounded-md border border-red-800 bg-red-950/30 p-4 text-sm text-red-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Còn readiness blocker</strong><p className="mt-1">Incident: {blockers.incidents}; Security: {blockers.securityFindings}; UAT fail/pending/missing: {blockers.uatFailures}/{blockers.uatPending}/{blockers.uatMissing}; Check lỗi/cũ: {blockers.staleChecks}; Known issue HIGH: {blockers.highKnownIssues}; Handoff: {blockers.handoffIncomplete}.</p></div></div>}
      {error && <p role="alert" className="rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}

      {canManage && (
        <div className="space-y-3 border-t border-slate-700 pt-5">
          <h3 className="font-semibold">Release actions</h3>
          {(currentStatus === "BLOCKED" || currentStatus === "READY_FOR_SIGNOFF" || currentStatus === "APPROVED") && <textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={3000} rows={2} placeholder="Lý do block/reopen/rollback" className="w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm" />}
          {currentStatus === "DRAFT" && <button type="button" onClick={() => transition("TESTING")} disabled={submitting} className="h-9 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white">Bắt đầu testing</button>}
          {currentStatus === "TESTING" && <div className="flex gap-2"><button type="button" onClick={() => transition("READY_FOR_SIGNOFF")} disabled={submitting} className="h-9 rounded-md bg-cyan-600 px-3 text-sm font-semibold text-white">Đưa sang sign-off</button><button type="button" onClick={() => transition("BLOCKED")} disabled={submitting || reason.trim().length < 1} className="h-9 rounded-md bg-red-800 px-3 text-sm font-semibold text-white">Block</button></div>}
          {(currentStatus === "READY_FOR_SIGNOFF" || currentStatus === "APPROVED") && <button type="button" onClick={() => transition("BLOCKED")} disabled={submitting || reason.trim().length < 1} className="inline-flex h-9 items-center gap-2 rounded-md bg-red-800 px-3 text-sm font-semibold text-white"><AlertTriangle className="h-4 w-4" /> Block release</button>}
          {currentStatus === "BLOCKED" && <button type="button" onClick={reopen} disabled={submitting || reason.trim().length < 1} className="h-9 rounded-md bg-amber-700 px-3 text-sm font-semibold text-white">Reopen về TESTING</button>}
          {currentStatus === "APPROVED" && <div className="space-y-2"><input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder={`Nhập: RELEASE ${version}`} className="h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm" /><button type="button" onClick={() => transition("RELEASED")} disabled={submitting || confirmation !== `RELEASE ${version}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle className="h-4 w-4" /> Mark RELEASED</button></div>}
          {currentStatus === "RELEASED" && <div className="space-y-2"><textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={3000} rows={2} placeholder="Lý do rollback bắt buộc" className="w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm" /><input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder={`Nhập: ROLLBACK ${version}`} className="h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm" /><button type="button" onClick={() => transition("ROLLED_BACK")} disabled={submitting || reason.trim().length < 1 || confirmation !== `ROLLBACK ${version}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-red-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><XCircle className="h-4 w-4" /> Mark ROLLED_BACK</button></div>}
        </div>
      )}
    </div>
  );
}
