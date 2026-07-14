import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { NewIncidentClient } from "./NewIncidentClient";
import { NewIncidentAntd } from "./NewIncidentAntd";
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

  const defaultModule = allowedModules.has(searchParams?.module || "") ? searchParams?.module || "GENERAL" : "GENERAL";
  const defaultContextType = allowedContextTypes.has(searchParams?.contextType || "") ? searchParams?.contextType || "" : "";
  const defaultContextId = String(searchParams?.contextId || "").slice(0, 500);
  const defaultContextUrl = String(searchParams?.contextUrl || "").startsWith("/") && !String(searchParams?.contextUrl || "").startsWith("//")
    ? String(searchParams?.contextUrl || "").slice(0, 1000)
    : "";

  let useAntd = false;
  try {
    const deps = {
      authenticate: async () => ({ userId: user.id }),
      reauthorizeResource: async () => ({ facilityId: (user as any).activeFacilityId || "global" }),
      loadConfig: loadPhase7FlagConfig,
      audit: () => {},
    };
    const decision = await evaluateScopedCapability({ capability: "antd-support", resourceId: (user as any).activeFacilityId || "global" }, deps);
    useAntd = decision.enabled;
  } catch (err) {
    console.error("Flag evaluation failed:", err);
  }

  const handleCreate = async (formData: FormData) => {
    "use server";
    const id = await createIncidentTicket(formData);
    redirect(`/support/incidents/${id}`);
  };

  if (useAntd) {
    return (
      <NewIncidentAntd
        defaultModule={defaultModule}
        defaultContextType={defaultContextType}
        defaultContextId={defaultContextId}
        defaultContextUrl={defaultContextUrl}
        onSubmitAction={handleCreate}
      />
    );
  }

  return (
    <NewIncidentClient
      defaultModule={defaultModule}
      defaultContextType={defaultContextType}
      defaultContextId={defaultContextId}
      defaultContextUrl={defaultContextUrl}
      onSubmitAction={handleCreate}
    />
  );
}
