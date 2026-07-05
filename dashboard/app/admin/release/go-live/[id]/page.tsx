import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getReleaseReadiness } from "../actions";
import { GO_LIVE_SIGNOFF_ROLES } from "../constants";
import GoLiveCommandPanel from "./GoLiveCommandPanel";

export default async function GoLiveCommandCenterPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const canRead = hasPermission(user.role, "release.read", user.permissions) || hasPermission(user.role, "release.manage", user.permissions);
  if (!canRead) {
    redirect("/");
  }

  const release = await prisma.releaseCandidate.findUnique({
    where: { id: params.id },
    include: {
      createdByUser: true,
      signOffs: {
        include: { signedByUser: true }
      }
    }
  });

  if (!release) notFound();

  const readiness = await getReleaseReadiness();
  const roles = [...GO_LIVE_SIGNOFF_ROLES];
  const signOffsByRole = roles.reduce((acc: any, role) => {
    acc[role] = release.signOffs.find(s => s.role === role) || { role, status: "PENDING" };
    return acc;
  }, {});

  const canSignOff = hasPermission(user.role, "release.signoff", user.permissions);
  const canManage = hasPermission(user.role, "release.manage", user.permissions);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/admin/release/go-live" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Release List
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Release: {release.version}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {new Date(release.createdAt).toLocaleDateString()} by {release.createdByUser?.fullName || "System"}
            </p>
          </div>
          <div>
            <span className={`px-3 py-1.5 rounded-md text-sm font-bold ${
              release.status === 'RELEASED' ? 'bg-green-100 text-green-700' :
              release.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              release.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {release.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Go-Live Sign-Offs</h2>
            <p className="text-sm text-muted-foreground mb-6">
              All listed roles must approve before this candidate can be transitioned to RELEASED.
            </p>
            <GoLiveCommandPanel 
              releaseId={release.id} 
              roles={roles} 
              signOffs={signOffsByRole} 
              canSignOff={canSignOff} 
              canManage={canManage}
              currentStatus={release.status}
              blockers={readiness.blockers}
            />
          </div>

          <div className="bg-card border rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Release Scope & Notes</h2>
            <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
              {release.notes || "No notes provided."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">System Readiness</h3>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">UAT Run</span>
                {readiness.latestUat ? (
                  <span className={`font-medium ${readiness.blockers.uatFailures === 0 && readiness.blockers.uatPending === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {readiness.latestUat.status}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active P0/P1 Incidents</span>
                <span className={`font-medium ${readiness.blockers.incidents === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {readiness.blockers.incidents}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Open P0/P1 Security Findings</span>
                <span className={`font-medium ${readiness.blockers.securityFindings === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {readiness.blockers.securityFindings}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Health Check</span>
                <span className={`font-medium ${readiness.checks.health.ok ? 'text-green-600' : 'text-orange-600'}`}>
                  {readiness.checks.health.status}{readiness.checks.health.stale ? " (STALE)" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Security Scan</span>
                <span className={`font-medium ${readiness.checks.security.ok ? 'text-green-600' : 'text-orange-600'}`}>
                  {readiness.checks.security.status}{readiness.checks.security.stale ? " (STALE)" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Performance Check</span>
                <span className={`font-medium ${readiness.checks.performance.ok ? 'text-green-600' : 'text-orange-600'}`}>
                  {readiness.checks.performance.status}{readiness.checks.performance.stale ? " (STALE)" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">DICOM Conformance</span>
                <span className={`font-medium ${readiness.checks.dicom.ok ? 'text-green-600' : 'text-orange-600'}`}>
                  {readiness.checks.dicom.status}{readiness.checks.dicom.stale ? " (STALE)" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
