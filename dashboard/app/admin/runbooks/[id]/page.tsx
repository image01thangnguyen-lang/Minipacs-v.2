import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { AlertTriangle, ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { removeRunbookStep, setRunbookActive } from "../actions";
import AddStepForm from "./AddStepForm";
import RunbookExecutor, { type ExecutorLogEntry } from "./RunbookExecutor";

function parseExecutorLog(raw: string | null): ExecutorLogEntry[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is ExecutorLogEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return candidate.kind === "STEP_COMPLETED" && typeof candidate.stepId === "string" && typeof candidate.stepOrder === "number";
    });
  } catch {
    return [];
  }
}

export default async function RunbookDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "runbook.read", session.user.permissions)) redirect("/");

  const runbook = await prisma.runbook.findUnique({
    where: { id: params.id },
    include: {
      steps: { orderBy: { order: "asc" } },
      executions: { orderBy: { startedAt: "desc" }, take: 5, include: { executedByUser: { select: { fullName: true } } } },
      _count: { select: { executions: true } },
    },
  });
  if (!runbook) notFound();

  const canManage = hasPermission(session.user.role, "runbook.manage", session.user.permissions);
  const canExecute = hasPermission(session.user.role, "runbook.execute", session.user.permissions);
  const activeExecution = runbook.executions.find((execution) => execution.status === "IN_PROGRESS");
  const activeExecutionData = activeExecution ? {
    id: activeExecution.id,
    log: parseExecutorLog(activeExecution.logJson),
    executorName: activeExecution.executedByUser?.fullName || "Người dùng",
    canControl: activeExecution.executedByUserId === session.user.id,
  } : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="border-b border-slate-700 pb-5">
        <Link href="/admin/runbooks" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại thư viện</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold">{runbook.name}</h1><p className="mt-1 max-w-3xl text-sm text-slate-400">{runbook.description || "Không có mô tả"}</p></div>
          <div className="flex items-center gap-2"><span className="rounded bg-slate-800 px-2 py-1 text-xs">{runbook.category}</span><span className={`rounded px-2 py-1 text-xs ${runbook.isActive ? "bg-emerald-950 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{runbook.isActive ? "ACTIVE" : "INACTIVE"}</span></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-md border border-slate-700 bg-slate-900/40">
            <div className="border-b border-slate-700 p-4"><h2 className="font-semibold">Các bước ({runbook.steps.length})</h2></div>
            <div className="divide-y divide-slate-800">
              {runbook.steps.map((step) => (
                <div key={step.id} className={`flex gap-4 p-4 ${step.isRisky ? "bg-amber-950/20" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.isRisky ? "bg-amber-900 text-amber-200" : "bg-slate-800 text-slate-300"}`}>{step.order}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{step.title}</h3>{step.isRisky && <span className="inline-flex items-center gap-1 rounded bg-amber-900 px-1.5 py-0.5 text-xs text-amber-200"><AlertTriangle className="h-3 w-3" /> Nguy hiểm</span>}</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">{step.description}</p>
                    {step.actionUrl?.startsWith("/") && !step.actionUrl.startsWith("//") && <Link href={step.actionUrl} className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"><ExternalLink className="h-3 w-3" /> Mở tác vụ</Link>}
                  </div>
                  {canManage && runbook._count.executions === 0 && (
                    <form><button formAction={async () => { "use server"; await removeRunbookStep(runbook.id, step.id); }} title="Xóa step" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-950 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></form>
                  )}
                </div>
              ))}
              {!runbook.steps.length && <p className="p-8 text-center text-sm text-slate-500">Chưa có step.</p>}
            </div>
          </section>

          {canManage && runbook.isActive && <AddStepForm runbookId={runbook.id} disabled={Boolean(activeExecution)} />}
          {canExecute && runbook.steps.length > 0 && runbook.isActive && <RunbookExecutor key={activeExecution?.id || "new"} runbookId={runbook.id} steps={runbook.steps.map((step) => ({ id: step.id, order: step.order, title: step.title, description: step.description, isRisky: step.isRisky, actionUrl: step.actionUrl }))} activeExecution={activeExecutionData} />}
        </div>

        <aside className="space-y-5">
          {canManage && (
            <form className="rounded-md border border-slate-700 bg-slate-900/40 p-4"><h2 className="mb-2 text-sm font-semibold">Trạng thái runbook</h2><p className="mb-3 text-xs text-slate-400">Runbook inactive không thể khởi chạy execution mới.</p><button formAction={async () => { "use server"; await setRunbookActive(runbook.id, !runbook.isActive); }} className={`h-9 w-full rounded-md px-3 text-sm font-semibold ${runbook.isActive ? "bg-slate-700 hover:bg-slate-600" : "bg-emerald-700 hover:bg-emerald-600"}`}>{runbook.isActive ? "Ngừng hoạt động" : "Kích hoạt"}</button></form>
          )}
          <section className="overflow-hidden rounded-md border border-slate-700 bg-slate-900/40">
            <div className="border-b border-slate-700 p-4"><h2 className="text-sm font-semibold">Lịch sử thực thi</h2></div>
            <div className="space-y-2 p-3">{runbook.executions.map((execution) => <div key={execution.id} className="rounded border border-slate-700 p-3 text-sm"><div className="flex justify-between gap-2"><strong className="truncate">{execution.executedByUser?.fullName || "System"}</strong><span className={execution.status === "COMPLETED" ? "text-emerald-400" : execution.status === "FAILED" ? "text-red-400" : execution.status === "IN_PROGRESS" ? "text-blue-400" : "text-amber-400"}>{execution.status}</span></div><p className="mt-1 text-xs text-slate-500">{execution.startedAt.toLocaleString("vi-VN")}</p></div>)}{!runbook.executions.length && <p className="py-4 text-center text-xs text-slate-500">Chưa thực thi.</p>}</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
