import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export default async function GoLiveListPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const canRead = hasPermission(user.role, "release.read", user.permissions) || hasPermission(user.role, "release.manage", user.permissions);
  const canManage = hasPermission(user.role, "release.manage", user.permissions);
  if (!canRead) {
    redirect("/");
  }

  const releases = await prisma.releaseCandidate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdByUser: true,
      signOffs: true
    }
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Go-Live Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage release candidates, readiness checklists, and go-live sign-offs.
          </p>
        </div>
        {canManage && (
          <Link href="/admin/release/go-live/new">
            <span className="inline-flex items-center rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80">
              <Plus className="mr-2 h-4 w-4" /> Create Release
            </span>
          </Link>
        )}
      </header>

      <div className="bg-card border rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-medium">Version</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Sign-offs</th>
              <th className="p-3 text-left font-medium">Created</th>
              <th className="p-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {releases.map(rc => {
              const approvedCount = rc.signOffs.filter(s => s.status === 'APPROVED').length;
              return (
                <tr key={rc.id} className="hover:bg-muted/50">
                  <td className="p-3">
                    <div className="font-medium text-base">{rc.version}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{rc.notes}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rc.status === 'RELEASED' ? 'bg-green-100 text-green-700' :
                      rc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      rc.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                      rc.status === 'ROLLED_BACK' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{approvedCount} / 4 roles</div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(rc.createdAt).toLocaleDateString()}
                    <div className="text-xs">by {rc.createdByUser?.fullName || "System"}</div>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/release/go-live/${rc.id}`}>
                      <span className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold text-vin-accent hover:bg-vin-panel">
                        View Command Center <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Link>
                  </td>
                </tr>
              )
            })}
            {releases.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No release candidates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
