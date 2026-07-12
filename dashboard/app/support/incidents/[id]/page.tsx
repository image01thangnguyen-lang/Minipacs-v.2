import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import IncidentCommentForm from "./IncidentCommentForm";
import { assignIncident, updateIncidentStatus } from "../actions";

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

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/support/incidents" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incidents
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <ScreenHeader />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Incident #{ticket.id.substring(0,8)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reported on {new Date(ticket.createdAt).toLocaleDateString()} by {ticket.reportedByUser?.fullName || "System"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-md text-sm font-bold ${
              ticket.severity === 'SEV1' ? 'bg-red-600 text-white' :
              ticket.severity === 'SEV2' ? 'bg-red-100 text-red-800' :
              ticket.severity === 'SEV3' ? 'bg-yellow-100 text-yellow-800' :
              'bg-vin-shell text-vin-text2'
            }`}>
              {ticket.severity}
            </span>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${
              ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
              ticket.status === 'CLOSED' ? 'bg-vin-shell text-vin-text2' :
              ticket.status === 'INVESTIGATING' ? 'bg-vin-accent/15 text-vin-accent' :
              'bg-orange-100 text-orange-700'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Description</h2>
            <div className="whitespace-pre-wrap text-sm">{ticket.shortDesc}</div>
          </div>

          <div className="bg-card border rounded-xl shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/30 font-semibold flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" /> Comments
            </div>

            <div className="p-4 space-y-4 flex-1">
              {comments.map(c => (
                <div key={c.id} className="text-sm bg-muted/30 p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">{c.createdByUser?.fullName || "System"}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">No comments yet.</div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/10">
              <IncidentCommentForm ticketId={ticket.id} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow p-5 space-y-4">
            <h3 className="font-semibold border-b pb-2 text-sm">Ticket Details</h3>
            <div className="text-sm space-y-3">
              <div>
                <span className="text-muted-foreground block text-xs">Module</span>
                <span className="font-medium">{ticket.module}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Context Type</span>
                <span className="font-medium">{ticket.contextType || "None"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Context ID</span>
                <span className="font-medium break-all">{ticket.contextId || "None"}</span>
              </div>
              {ticket.contextUrl?.startsWith("/") && !ticket.contextUrl.startsWith("//") && (
                <div>
                  <span className="text-muted-foreground block text-xs">Context Link</span>
                  <Link className="font-medium text-vin-accent hover:underline" href={ticket.contextUrl}>
                    Open related page
                  </Link>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block text-xs">Assignee</span>
                <span className="font-medium">{ticket.assigneeUser?.fullName || "Unassigned"}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-card border rounded-xl shadow p-5 space-y-4">
              <h3 className="font-semibold border-b pb-2 text-sm">Admin Actions</h3>
              <form className="space-y-2">
                <select
                  name="status"
                  defaultValue={ticket.status}
                  className="w-full text-sm border rounded p-1.5"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button
                  type="submit"
                  formAction={async (formData) => {
                    "use server";
                    const newStatus = formData.get("status") as string;
                    await updateIncidentStatus(ticket.id, newStatus);
                  }}
                  className="w-full rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80"
                >
                  Update Status
                </button>
              </form>
              <form className="space-y-2 border-t pt-4">
                <label className="block text-xs font-medium text-muted-foreground">Assign to</label>
                <select
                  name="assigneeUserId"
                  defaultValue={ticket.assigneeUserId || ""}
                  className="w-full rounded border p-1.5 text-sm"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.fullName} ({option.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  formAction={async formData => {
                    "use server";
                    await assignIncident(ticket.id, String(formData.get("assigneeUserId") || "") || null);
                  }}
                  className="w-full rounded border border-vin-border px-3 py-2 text-sm font-semibold transition hover:border-vin-accent"
                >
                  Update Assignee
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
