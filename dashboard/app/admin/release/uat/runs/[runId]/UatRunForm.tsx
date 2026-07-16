"use client";

import { useState } from "react";
import { updateUatResult, finishUatRun, addUatEvidence } from "../../actions";
import { CheckCircle, XCircle, SkipForward, Ban, Paperclip, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type UatResultStatus = "PENDING" | "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";

const buttonBase = "inline-flex items-center justify-center rounded px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const outlineButton = `${buttonBase} border border-vin-border bg-vin-panel text-vin-text2 hover:bg-vin-tableSelected hover:text-white`;

export default function UatRunForm({ run, canExecute }: { run: any; canExecute: boolean }) {
  const router = useRouter();
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isScrubbed, setIsScrubbed] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  const results = run.results || [];
  const total = results.length;

  if (total === 0) {
    return <div className="p-6 text-center text-muted-foreground border rounded bg-card">No test cases found in this suite.</div>;
  }

  const activeResult = results[activeCaseIndex];
  const activeCase = activeResult.caseRef;

  const handleUpdate = async (status: Exclude<UatResultStatus, "PENDING">) => {
    setIsSubmitting(true);
    try {
      await updateUatResult(run.id, activeCase.id, status, notes);
      setNotes("");
      setShowEvidenceForm(false);
      setEvidenceUrl("");
      setIsScrubbed(false);
      if (activeCaseIndex < total - 1) {
        setActiveCaseIndex(prev => prev + 1);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Could not update UAT result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!isScrubbed) return alert("Must attest PHI is scrubbed.");
    if (!evidenceUrl) return alert("Must provide a link or text.");

    setIsSubmitting(true);
    try {
      await addUatEvidence(activeResult.id, evidenceUrl, isScrubbed);
      setShowEvidenceForm(false);
      setEvidenceUrl("");
      setIsScrubbed(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async (isApproved: boolean) => {
    setIsSubmitting(true);
    try {
      await finishUatRun(run.id, isApproved);
      router.push("/admin/release/uat");
    } catch (e: any) {
      alert(e.message || "Could not finish UAT run.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = results.filter((r: any) => r.status !== "PENDING").length;
  const allCompleted = completedCount === total;
  const hasFailures = results.some((r: any) => r.status === "FAIL" || r.status === "BLOCKED");

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="bg-card border rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              Case {activeCaseIndex + 1} of {total}: {activeCase.title}
            </h2>
            <span className={`px-2 py-1 text-sm rounded font-medium ${
              activeResult.status === 'PASS' ? 'bg-green-100 text-green-700' :
              activeResult.status === 'FAIL' ? 'bg-red-100 text-red-700' :
              activeResult.status === 'BLOCKED' ? 'bg-orange-100 text-orange-700' :
              activeResult.status === 'SKIPPED' ? 'bg-slate-100 text-slate-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {activeResult.status}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            {activeCase.description && (
              <div>
                <h4 className="font-semibold text-muted-foreground uppercase text-sm mb-1">Preconditions</h4>
                <div className="whitespace-pre-wrap">{activeCase.description}</div>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-muted-foreground uppercase text-sm mb-1">Steps</h4>
              <div className="whitespace-pre-wrap bg-muted p-3 rounded">{activeCase.steps}</div>
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground uppercase text-sm mb-1">Expected Result</h4>
              <div className="whitespace-pre-wrap bg-primary/5 p-3 rounded border border-primary/20">{activeCase.expected}</div>
            </div>
          </div>

          {canExecute && (
            <div className="mt-8 pt-6 border-t space-y-4">
              <div>
                <label className="text-sm font-medium">Actual Result / Notes</label>
                <textarea
                  placeholder="Describe what actually happened..."
                  className="mt-1 min-h-[90px] w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text2 outline-none focus:border-vin-accent"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {showEvidenceForm ? (
                <div className="bg-orange-50/50 border border-orange-200 rounded p-4 space-y-3">
                  <h5 className="text-sm font-semibold flex items-center text-orange-800">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Attach Evidence
                  </h5>
                  <p className="text-sm text-orange-700">
                    Ensure all screenshots, logs, or links are strictly scrubbed of Protected Health Information (PHI) before attaching.
                  </p>
                  <input
                    type="url"
                    placeholder="https://link-to-screenshot-or-doc..."
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={evidenceUrl}
                    onChange={e => setEvidenceUrl(e.target.value)}
                  />
                  <label className="flex items-center space-x-2 text-sm mt-2">
                    <input type="checkbox" checked={isScrubbed} onChange={e => setIsScrubbed(e.target.checked)} className="rounded border-gray-300" />
                    <span>I confirm this evidence contains no PHI (Patient Names, Accessions, MRN, etc).</span>
                  </label>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className={`${buttonBase} bg-vin-accent text-white hover:bg-vin-accent/80`}
                      onClick={handleAddEvidence}
                      disabled={!isScrubbed || !evidenceUrl || isSubmitting}
                    >
                      Save Evidence
                    </button>
                    <button
                      type="button"
                      className={outlineButton}
                      onClick={() => setShowEvidenceForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={outlineButton}
                  onClick={() => setShowEvidenceForm(true)}
                  disabled={isSubmitting}
                >
                  <Paperclip className="w-4 h-4 mr-2" /> Add Evidence Link
                </button>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  className={`${buttonBase} border border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
                  onClick={() => handleUpdate("PASS")}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Pass
                </button>
                <button
                  type="button"
                  className={`${buttonBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                  onClick={() => handleUpdate("FAIL")}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Fail
                </button>
                <button
                  type="button"
                  className={`${buttonBase} border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`}
                  onClick={() => handleUpdate("BLOCKED")}
                  disabled={isSubmitting}
                >
                  <Ban className="mr-2 h-4 w-4" /> Blocked
                </button>
                <button
                  type="button"
                  className={outlineButton}
                  onClick={() => handleUpdate("SKIPPED")}
                  disabled={isSubmitting}
                >
                  <SkipForward className="mr-2 h-4 w-4" /> Skip
                </button>
              </div>
            </div>
          )}

          {!canExecute && activeResult.notes && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-muted-foreground uppercase text-sm mb-1">Notes</h4>
              <p className="text-sm">{activeResult.notes}</p>
            </div>
          )}
        </div>

        {canExecute && (
          <div className="bg-card border rounded-xl shadow p-6">
            <h3 className="font-bold mb-4">Complete Run</h3>
            <p className="text-sm text-muted-foreground mb-6">
              When all cases are executed, you can approve or reject this UAT run.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleFinish(true)}
                disabled={isSubmitting || hasFailures || !allCompleted}
                className={`${buttonBase} w-full bg-green-600 text-white hover:bg-green-700`}
              >
                Approve Run
              </button>
              {hasFailures && <p className="text-sm text-orange-600 text-center">Cannot approve with failed or blocked cases.</p>}
              {!allCompleted && <p className="text-sm text-orange-600 text-center">Complete or skip every case before approving.</p>}

              <button
                type="button"
                onClick={() => handleFinish(false)}
                disabled={isSubmitting}
                className={`${buttonBase} w-full bg-red-600 text-white hover:bg-red-700`}
              >
                Reject / Abort Run
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Case Progress ({completedCount}/{total})</h3>
        </div>
        <div className="p-2 max-h-[400px] overflow-y-auto">
          {results.map((r: any, idx: number) => (
            <button
              key={r.id}
              onClick={() => setActiveCaseIndex(idx)}
              className={`w-full text-left px-4 py-3 rounded-md text-sm flex items-center justify-between mb-1 ${
                idx === activeCaseIndex ? 'bg-primary/10 font-medium' : 'hover:bg-muted'
              }`}
            >
              <span className="truncate pr-4">
                {idx + 1}. {r.caseRef.title}
              </span>
              <span className={`flex-shrink-0 text-sm px-2 py-1 rounded-full ${
                r.status === 'PASS' ? 'bg-green-100 text-green-700' :
                r.status === 'FAIL' ? 'bg-red-100 text-red-700' :
                r.status === 'BLOCKED' ? 'bg-orange-100 text-orange-700' :
                r.status === 'SKIPPED' ? 'bg-slate-100 text-slate-700' :
                'bg-muted text-muted-foreground'
              }`}>
                {r.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
