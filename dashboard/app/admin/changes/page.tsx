import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const BOARD_COLUMNS = ["REQUESTED", "REVIEWING", "APPROVED", "IMPLEMENTED"] as const;

export default async function ChangeRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "change.read", session.user.permissions)) redirect("/");

  const changes = await prisma.changeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requestedByUser: { select: { fullName: true } },
      release: { select: { version: true } },
      approvals: { select: { status: true } },
    },
  });
  const canCreate = hasPermission(session.user.role, "change.request", session.user.permissions)
    || hasPermission(session.user.role, "change.manage", session.user.permissions);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 pb-5">
        <div>
          <h1 className="text-2xl font-bold">Change Request Board</h1>
          <p className="mt-1 text-sm text-slate-400">Theo dõi đề xuất, review độc lập, UAT và release mục tiêu.</p>
        </div>
        {canCreate && (
          <Link href="/admin/changes/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500">
            <Plus className="h-4 w-4" /> Tạo yêu cầu
          </Link>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Change request workflow">
        {BOARD_COLUMNS.map((column) => {
          const items = changes.filter((change) => change.status === column);
          return (
            <div key={column} className="min-h-52 rounded-md border border-slate-700 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">{column}</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((change) => {
                  const approved = change.approvals.filter((approval) => approval.status === "APPROVED").length;
                  const rejected = change.approvals.filter((approval) => approval.status === "REJECTED").length;
                  return (
                    <Link key={change.id} href={`/admin/changes/${change.id}`} className="block rounded-md border border-slate-700 bg-slate-950 p-3 hover:border-cyan-500">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold">{change.title}</h3>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${change.riskLevel === "HIGH" ? "bg-red-950 text-red-300" : change.riskLevel === "MEDIUM" ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300"}`}>
                          {change.riskLevel}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-400">{change.impactSummary || change.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate">{change.requestedByUser?.fullName || "System"}</span>
                        <span>{approved} duyệt / {rejected} từ chối</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5">{change.module}</span>
                        {change.release && <span className="rounded bg-blue-950 px-1.5 py-0.5 text-blue-300">{change.release.version}</span>}
                        {change.uatRequired && <span className="rounded bg-violet-950 px-1.5 py-0.5 text-violet-300">UAT</span>}
                      </div>
                    </Link>
                  );
                })}
                {items.length === 0 && <p className="py-8 text-center text-xs text-slate-500">Chưa có yêu cầu</p>}
              </div>
            </div>
          );
        })}
      </section>

      {changes.some((change) => change.status === "REJECTED" || change.status === "CANCELLED") && (
        <section className="overflow-x-auto rounded-md border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-slate-400">
              <tr><th className="p-3">Đã đóng</th><th className="p-3">Module</th><th className="p-3">Rủi ro</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Chi tiết</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {changes.filter((change) => change.status === "REJECTED" || change.status === "CANCELLED").map((change) => (
                <tr key={change.id}>
                  <td className="p-3 font-medium">{change.title}</td><td className="p-3">{change.module}</td><td className="p-3">{change.riskLevel}</td><td className="p-3">{change.status}</td>
                  <td className="p-3 text-right"><Link href={`/admin/changes/${change.id}`} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">Xem <ArrowRight className="h-3 w-3" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
