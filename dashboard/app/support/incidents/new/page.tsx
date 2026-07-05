import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { createIncidentTicket } from "../actions";

const allowedModules = new Set(["GENERAL", "VIEWER", "HIS_GATEWAY", "REPORTING", "STORAGE", "WORKLIST", "NON_DICOM", "SHARING", "OPS"]);
const allowedContextTypes = new Set(["", "STUDY", "REPORT", "ORDER", "DICOM_NODE", "EXPORT_JOB", "HIS_LOG", "URL"]);

export default async function ReportIncidentPage({
  searchParams,
}: {
  searchParams?: { module?: string; contextType?: string; contextId?: string; contextUrl?: string };
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }
  if (!hasPermission(user.role, "incident.report", user.permissions) && !hasPermission(user.role, "incident.manage", user.permissions)) {
    redirect("/");
  }

  const defaultModule = allowedModules.has(searchParams?.module || "") ? searchParams?.module : "GENERAL";
  const defaultContextType = allowedContextTypes.has(searchParams?.contextType || "") ? searchParams?.contextType : "";
  const defaultContextId = String(searchParams?.contextId || "").slice(0, 500);
  const defaultContextUrl = String(searchParams?.contextUrl || "").startsWith("/") && !String(searchParams?.contextUrl || "").startsWith("//")
    ? String(searchParams?.contextUrl || "").slice(0, 1000)
    : "";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/support/incidents" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incidents
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Incident</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log an operational issue or system bug. 
          </p>
        </div>
      </header>

      <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm flex items-start border border-red-200">
        <ShieldAlert className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-red-600" />
        <div>
          <strong className="text-base font-bold">STRICT RULE: NO PHI ALLOWED</strong>
          <p className="mt-1 text-red-700">
            Do not include any Protected Health Information (PHI) in incident descriptions. 
            This includes Patient Names, MRNs, Accession Numbers, or raw clinical text. 
            Any identifying data must be completely scrubbed before submission.
          </p>
        </div>
      </div>

      <form 
        action={async (formData) => {
          "use server";
          const id = await createIncidentTicket(formData);
          redirect(`/support/incidents/${id}`);
        }} 
        className="bg-card border rounded-xl shadow p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Issue Description (Scrubbed)</label>
          <textarea 
            name="shortDesc"
            required
            placeholder="Describe the issue without revealing PHI..."
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select name="severity" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              <option value="SEV4">SEV4 - Minor Issue / Cosmetic</option>
              <option value="SEV3">SEV3 - Major Issue with Workaround</option>
              <option value="SEV2">SEV2 - Severe Impact / Partial Outage</option>
              <option value="SEV1">SEV1 - Critical / Total Outage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Affected Module</label>
            <select name="module" defaultValue={defaultModule} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              <option value="GENERAL">General System</option>
              <option value="VIEWER">DICOM Viewer</option>
              <option value="HIS_GATEWAY">HIS/EMR Gateway</option>
              <option value="REPORTING">Reporting Module</option>
              <option value="STORAGE">Storage / Archive</option>
              <option value="WORKLIST">Worklist</option>
              <option value="NON_DICOM">Non-DICOM</option>
              <option value="SHARING">Sharing / Consultation</option>
              <option value="OPS">Operations</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Context Type (Optional)</label>
            <select
              name="contextType"
              defaultValue={defaultContextType}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">None</option>
              <option value="STUDY">Study</option>
              <option value="REPORT">Report</option>
              <option value="ORDER">Order</option>
              <option value="DICOM_NODE">DICOM Node</option>
              <option value="EXPORT_JOB">Export Job</option>
              <option value="HIS_LOG">HIS Log</option>
              <option value="URL">URL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Context ID (Scrubbed / UUID)</label>
            <input 
              name="contextId"
              defaultValue={defaultContextId}
              placeholder="System ID only (no Accessions)"
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <input type="hidden" name="contextUrl" value={defaultContextUrl} />
        {defaultContextUrl && (
          <div className="rounded border border-vin-border bg-vin-panel px-3 py-2 text-xs text-vin-text2">
            Context link: <span className="font-mono">{defaultContextUrl}</span>
          </div>
        )}

        <div className="pt-4 border-t border-dashed">
          <label className="flex items-center space-x-3 text-sm">
            <input type="checkbox" name="containsPhiRisk" id="containsPhiRisk" className="rounded border-gray-300 w-4 h-4" />
            <span className="font-semibold text-red-700">Warning: This description contains or risks containing PHI.</span>
          </label>
          <p className="text-xs text-muted-foreground mt-2 ml-7">
            If you check this box, the system will block the submission. You MUST scrub the data first and leave this unchecked to attest it is safe.
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full rounded bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80"
          >
            Submit Incident Ticket
          </button>
        </div>
      </form>
    </div>
  );
}
