"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { signOffRelease, transitionRelease } from "../actions";
import { useRouter } from "next/navigation";

type ReadinessBlockers = {
  incidents: number;
  securityFindings: number;
  uatFailures: number;
  uatPending: number;
  uatMissing: number;
  staleChecks: number;
};

const buttonBase = "inline-flex items-center justify-center rounded px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const outlineButton = `${buttonBase} border border-vin-border bg-vin-panel text-vin-text2 hover:bg-vin-tableSelected hover:text-white`;

export default function GoLiveCommandPanel({
  releaseId,
  roles,
  signOffs,
  canSignOff,
  canManage,
  currentStatus,
  blockers
}: {
  releaseId: string;
  roles: string[];
  signOffs: any;
  canSignOff: boolean;
  canManage: boolean;
  currentStatus: string;
  blockers: ReadinessBlockers;
}) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allApproved = roles.every(r => signOffs[r]?.status === "APPROVED");
  const hasBlockerRisk = Object.values(blockers).some(count => count > 0);

  const handleSignOff = async (status: "APPROVED" | "REJECTED") => {
    if (!activeRole) return;
    setIsSubmitting(true);
    try {
      await signOffRelease(releaseId, activeRole, status, notes);
      setNotes("");
      setActiveRole(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (status: string) => {
    setIsSubmitting(true);
    try {
      await transitionRelease(releaseId, status);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map(role => {
          const so = signOffs[role];
          const isPending = so.status === "PENDING";
          const isApproved = so.status === "APPROVED";
          const isRejected = so.status === "REJECTED";

          return (
            <div key={role} className={`border rounded-lg p-4 ${isApproved ? 'bg-green-50/30 border-green-200' : isRejected ? 'bg-red-50/30 border-red-200' : 'bg-muted/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{role} Sign-Off</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isApproved ? 'bg-green-100 text-green-700' :
                  isRejected ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {so.status}
                </span>
              </div>
              
              {so.notes && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2" title={so.notes}>
                  &quot;{so.notes}&quot;
                </p>
              )}
              {so.signedByUser && (
                <p className="text-xs text-muted-foreground mb-3">
                  by {so.signedByUser.fullName} on {so.signedAt ? new Date(so.signedAt).toLocaleDateString() : ''}
                </p>
              )}

              {canSignOff && currentStatus !== "RELEASED" && currentStatus !== "ROLLED_BACK" && (
                <div className="mt-2">
                  {activeRole === role ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        placeholder="Sign-off notes..." 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="min-h-[60px] w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-xs text-vin-text2 outline-none focus:border-vin-accent"
                      />
                      <div className="flex gap-2">
                        <button type="button" className={`${buttonBase} h-7 bg-green-600 px-2 text-xs text-white hover:bg-green-700`} onClick={() => handleSignOff("APPROVED")} disabled={isSubmitting}>Approve</button>
                        <button type="button" className={`${buttonBase} h-7 bg-red-600 px-2 text-xs text-white hover:bg-red-700`} onClick={() => handleSignOff("REJECTED")} disabled={isSubmitting}>Reject</button>
                        <button type="button" className={`${outlineButton} h-7 px-2 text-xs`} onClick={() => setActiveRole(null)} disabled={isSubmitting}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`${outlineButton} h-8 w-full text-xs`}
                      onClick={() => { setActiveRole(role); setNotes(so.notes || ""); }}
                    >
                      Update Sign-Off
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasBlockerRisk && activeRole && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm flex items-start border border-red-200">
          <ShieldAlert className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-red-600" />
          <div>
            <strong>Warning: Open Blockers Detected</strong>
            <p className="mt-1 text-red-700">
              There are open go-live blockers: {blockers.incidents} incident(s), {blockers.securityFindings} security finding(s), {blockers.uatFailures} UAT failure(s), {blockers.uatPending} pending UAT case(s), {blockers.uatMissing} missing UAT run(s), and {blockers.staleChecks} stale or failing readiness check(s). Standard approval is blocked unless the signer has risk-acceptance permission.
            </p>
          </div>
        </div>
      )}

      {canManage && (
        <div className="mt-8 pt-6 border-t flex flex-col gap-4">
          <h3 className="font-semibold">Release Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              disabled={!allApproved || currentStatus === "RELEASED" || currentStatus === "ROLLED_BACK" || isSubmitting}
              onClick={() => handleTransition("RELEASED")}
              className={`${buttonBase} bg-vin-accent text-white hover:bg-vin-accent/80`}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Go Live / Mark Released
            </button>
            <button
              type="button"
              className={`${buttonBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
              disabled={currentStatus === "ROLLED_BACK" || isSubmitting}
              onClick={() => {
                if (confirm("Are you sure you want to block this release?")) handleTransition("BLOCKED");
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Block Release
            </button>
            {currentStatus === "RELEASED" && (
              <button
                type="button"
                disabled={isSubmitting}
                className={`${buttonBase} bg-red-600 text-white hover:bg-red-700`}
                onClick={() => {
                  if (confirm("Are you sure you want to rollback this release? This will mark it as ROLLED_BACK.")) handleTransition("ROLLED_BACK");
                }}
              >
                <XCircle className="mr-2 h-4 w-4" /> Trigger Rollback
              </button>
            )}
          </div>
          {!allApproved && currentStatus !== "RELEASED" && currentStatus !== "ROLLED_BACK" && (
            <p className="text-xs text-muted-foreground">
              All roles must sign off before the release can go live.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
