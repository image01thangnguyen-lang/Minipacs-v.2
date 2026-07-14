import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import { evaluateScopedCapability, loadPhase7FlagConfig } from "@/lib/release-control/server-flags";
import { assignIncident, updateIncidentStatus } from "../actions";
import { IncidentDetailClient } from "./IncidentDetailClient";
import { IncidentDetailAntd } from "./IncidentDetailAntd";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
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

  const ticket = await prisma.incidentTicket.findUnique({
    where: { id: params.id },
    include: {
      reportedByUser: true,
      assigneeUser: true
    }
  });

  if (!ticket) notFound();

  // Non-admins can only see their own tickets
  if (!isAdmin && ticket.reportedByUserId !== user.id && ticket.assigneeUserId !== user.id) {
    redirect("/support/incidents");
  }

  const [comments, assigneeOptions] = await Promise.all([
    prisma.incidentComment.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: "asc" },
      include: { createdByUser: true }
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, fullName: true, role: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([]),
  ]);

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

  const handleUpdateStatus = async (formData: FormData) => {
    "use server";
    const newStatus = formData.get("status") as string;
    await updateIncidentStatus(ticket.id, newStatus);
  };

  const handleAssign = async (formData: FormData) => {
    "use server";
    await assignIncident(ticket.id, String(formData.get("assigneeUserId") || "") || null);
  };

  if (useAntd) {
    return (
      <IncidentDetailAntd
        ticket={ticket}
        comments={comments}
        assigneeOptions={assigneeOptions}
        isAdmin={isAdmin}
        onUpdateStatus={handleUpdateStatus}
        onAssign={handleAssign}
      />
    );
  }

  return (
    <IncidentDetailClient
      ticket={ticket}
      comments={comments}
      assigneeOptions={assigneeOptions}
      isAdmin={isAdmin}
      onUpdateStatus={handleUpdateStatus}
      onAssign={handleAssign}
    />
  );
}
