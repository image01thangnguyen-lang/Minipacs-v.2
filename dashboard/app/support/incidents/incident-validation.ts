const SEVERITIES = new Set(["SEV1", "SEV2", "SEV3", "SEV4"]);
const STATUSES = new Set(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]);
const MODULES = new Set([
  "GENERAL",
  "VIEWER",
  "HIS_GATEWAY",
  "REPORTING",
  "STORAGE",
  "WORKLIST",
  "NON_DICOM",
  "SHARING",
  "OPS",
]);
const CONTEXT_TYPES = new Set(["", "STUDY", "REPORT", "ORDER", "DICOM_NODE", "EXPORT_JOB", "HIS_LOG", "URL"]);

export function cleanIncidentText(value: FormDataEntryValue | string | null, maxLength = 4000) {
  return String(value || "").trim().slice(0, maxLength);
}

export function cleanIncidentInternalPath(value: FormDataEntryValue | string | null) {
  const path = cleanIncidentText(value, 1000);
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Context URL must be an internal application path");
  }
  return path;
}

export function looksLikePhi(value: string) {
  const patterns = [
    /\bMRN\s*[:#-]?\s*\w+/i,
    /\bAccession\s*[:#-]?\s*\w+/i,
    /\bPatient\s*(Name|ID)\s*[:#-]?\s*[\w\s-]+/i,
    /\b\d{8,}\b/,
  ];
  return patterns.some(pattern => pattern.test(value));
}

export type CreateIncidentInput = Readonly<{
  shortDesc: string;
  severity: string;
  module: string;
  contextType: string | null;
  contextId: string | null;
  contextUrl: string | null;
}>;

export function parseCreateIncidentInput(formData: FormData): CreateIncidentInput {
  const shortDesc = cleanIncidentText(formData.get("shortDesc"));
  const severity = cleanIncidentText(formData.get("severity")) || "SEV4";
  const module = cleanIncidentText(formData.get("module")) || "GENERAL";
  const contextType = cleanIncidentText(formData.get("contextType")).toUpperCase();
  const contextId = cleanIncidentText(formData.get("contextId"), 500);
  const contextUrl = cleanIncidentInternalPath(formData.get("contextUrl"));

  if (!shortDesc) throw new Error("Description is required");
  if (!SEVERITIES.has(severity)) throw new Error("Invalid incident severity");
  if (!MODULES.has(module)) throw new Error("Invalid incident module");
  if (!CONTEXT_TYPES.has(contextType)) throw new Error("Invalid context type");
  if (formData.get("containsPhiRisk") === "on") {
    throw new Error("Incidents containing PHI cannot be saved. Please scrub the data first.");
  }
  if (looksLikePhi(`${shortDesc} ${contextId}`)) {
    throw new Error("Potential PHI detected. Please scrub patient names, MRN, accession, and identifiers before saving.");
  }

  return {
    shortDesc,
    severity,
    module,
    contextType: contextType || null,
    contextId: contextId || null,
    contextUrl,
  };
}

export function parseIncidentStatus(status: string) {
  const nextStatus = cleanIncidentText(status);
  if (!STATUSES.has(nextStatus)) throw new Error("Invalid incident status");
  return nextStatus;
}