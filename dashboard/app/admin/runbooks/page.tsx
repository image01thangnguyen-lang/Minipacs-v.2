import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BookOpen, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const CATEGORIES: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "DEPLOYMENT", label: "Deployment", icon: BookOpen },
  { key: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { key: "INCIDENT_RESPONSE", label: "Incident Response", icon: AlertTriangle },
];

export default async function RunbooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "runbook.read", session.user.permissions)) redirect("/");
  const canManage = hasPermission(session.user.role, "runbook.manage", session.user.permissions);

  const runbooks = await prisma.runbook.findMany({
    where: canManage ? undefined : { isActive: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      steps: { select: { isRisky: true } },
      executions: { orderBy: { startedAt: "desc" }, take: 1, select: { status: true, startedAt: true } },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 pb-5">
        <div><ScreenHeader /><p className="mt-1 text-sm text-slate-400">Quy trình vận hành có kiểm soát, xác nhận step nguy hiểm và audit đầy đủ.</p></div>
        {canManage && <Link href="/admin/runbooks/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"><Plus className="h-4 w-4" /> Tạo runbook</Link>}
      </header>

      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const items = runbooks.filter((runbook) => runbook.category === key);
        if (!items.length) return null;
        return (
          <section key={key}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-slate-400"><Icon className="h-4 w-4" /> {label}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((runbook) => {
                const lastExecution = runbook.executions[0];
                const riskyCount = runbook.steps.filter((step) => step.isRisky).length;
                return (
                  <Link key={runbook.id} href={`/admin/runbooks/${runbook.id}`} className={`rounded-md border bg-slate-900/40 p-4 hover:border-cyan-500 ${runbook.isActive ? "border-slate-700" : "border-slate-800 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{runbook.name}</h3><span className={`rounded px-2 py-0.5 text-xs ${runbook.isActive ? "bg-emerald-950 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{runbook.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-400">{runbook.description || "Không có mô tả"}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                      <span>{runbook.steps.length} step{riskyCount ? ` / ${riskyCount} nguy hiểm` : ""}</span>
                      <span>{lastExecution ? `Gần nhất: ${lastExecution.status}` : "Chưa chạy"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      {!runbooks.length && <p className="rounded-md border border-slate-700 p-10 text-center text-sm text-slate-400">Chưa có runbook.</p>}
    </main>
  );
}
