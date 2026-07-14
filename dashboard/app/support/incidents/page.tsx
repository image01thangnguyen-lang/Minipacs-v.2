import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { IncidentsClient } from "./IncidentsClient";
import { IncidentsAntd } from "./IncidentsAntd";

export default async function IncidentsListPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const isAdmin = hasPermission(user.role, "incident.manage", user.permissions);
  const canReport = hasPermission(user.role, "incident.report", user.permissions);
  const canRead = hasPermission(user.role, "incident.read", user.permissions) || isAdmin || canReport;
  if (!canRead) {
    redirect("/");
  }

  const incidents = await prisma.incidentTicket.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { reportedByUserId: user.id },
            { assigneeUserId: user.id },
          ],
        },
    orderBy: { createdAt: "desc" },
    include: {
      reportedByUser: true,
      assigneeUser: true
    }
  });

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

  if (useAntd) {
    return <IncidentsAntd incidents={incidents} isAdmin={isAdmin} canReport={canReport} />;
  }
  return <IncidentsClient incidents={incidents} isAdmin={isAdmin} canReport={canReport} />;
}
