import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateChangeStatus } from "../actions";
import ChangeReviewPanel from "./ChangeReviewPanel";

const NEXT_STATUSES: Record<string, string[]> = {
  REQUESTED: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["IMPLEMENTED", "CANCELLED"],
};

export default async function ChangeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "change.read", session.user.permissions)) redirect("/");

  const change = await prisma.changeRequest.findUnique({
    where: { id: params.id },
    include: {
      requestedByUser: { select: { fullName: true } },
      release: { select: { id: true, version: true, status: true } },
      uatSuite: { select: { id: true, name: true, version: true } },
      incident: { select: { id: true, severity: true, status: true, shortDesc: true } },
      approvals: { include: { reviewerUser: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!change) notFound();

  const canManage = hasPermission(session.user.role, "change.manage", session.user.permissions);
  const canApprove = hasPermission(session.user.role, "change.approve", session.user.permissions)
    && change.requestedByUserId !== session.user.id;
  const currentReview = change.approvals.find((approval) => approval.reviewerUserId === session.user.id);
  const nextStatuses = NEXT_STATUSES[change.status] ?? [];
  const approvedCount = change.approvals.filter((approval) => approval.status === "APPROVED").length;
  const rejectedCount = change.approvals.filter((approval) => approval.status === "REJECTED").length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="border-b border-slate-700 pb-5">
        <Link href="/admin/changes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại board</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold">{change.title}</h1><p className="mt-1 text-sm text-slate-400">Đề xuất bởi {change.requestedByUser?.fullName || "System"} lúc {change.createdAt.toLocaleString("vi-VN")}</p></div>
          <div className="flex gap-2"><span className="rounded bg-slate-800 px-2 py-1 text-sm">{change.module}</span><span className={`rounded px-2 py-1 text-sm font-bold ${change.riskLevel === "HIGH" ? "bg-red-950 text-red-300" : change.riskLevel === "MEDIUM" ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300"}`}>{change.riskLevel}</span><span className="rounded bg-blue-950 px-2 py-1 text-sm text-blue-300">{change.status}</span></div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><h2 className="mb-2 text-sm font-semibold text-slate-400">Mô tả thay đổi</h2><p className="whitespace-pre-wrap text-sm">{change.description}</p></section>
          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><h2 className="mb-2 text-sm font-semibold text-slate-400">Tác động dự kiến</h2><p className="whitespace-pre-wrap text-sm">{change.impactSummary || "Chưa ghi nhận"}</p></section>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><h2 className="mb-2 text-sm font-semibold text-slate-400">Kế hoạch rollback</h2><p className="whitespace-pre-wrap text-sm">{change.rollbackPlan || "Không áp dụng"}</p></section>
            <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><h2 className="mb-2 text-sm font-semibold text-slate-400">Ảnh hưởng release note</h2><p className="whitespace-pre-wrap text-sm">{change.releaseNotesImpact || "Không có"}</p></section>
          </div>

          {change.riskLevel === "HIGH" && (
            <div className="flex gap-3 rounded-md border border-red-800 bg-red-950/30 p-4 text-sm text-red-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Thay đổi rủi ro cao</strong><p className="mt-1">Cần reviewer độc lập, kế hoạch rollback, UAT và nội dung release note trước khi triển khai.</p></div></div>
          )}

          <ChangeReviewPanel changeId={change.id} canApprove={canApprove} currentStatus={change.status} initialNotes={currentReview?.notes || ""} initialReviewStatus={currentReview?.status || null} />
        </div>

        <aside className="space-y-5">
          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-4">
            <h2 className="mb-3 text-sm font-semibold">Liên kết kiểm soát</h2>
            <div className="space-y-2 text-sm">
              {change.release ? <Link href={`/admin/release/go-live/${change.release.id}`} className="flex items-center justify-between rounded border border-slate-700 p-2 hover:border-cyan-500"><span>Release {change.release.version}</span><ExternalLink className="h-3 w-3" /></Link> : <p className="text-slate-500">Chưa liên kết release</p>}
              {change.uatSuite ? <Link href="/admin/release/uat" className="flex items-center justify-between rounded border border-slate-700 p-2 hover:border-cyan-500"><span>UAT: {change.uatSuite.name}</span><ExternalLink className="h-3 w-3" /></Link> : <p className="text-slate-500">{change.uatRequired ? "Cần UAT nhưng chưa liên kết suite" : "Không yêu cầu UAT"}</p>}
              {change.incident ? <Link href={`/support/incidents/${change.incident.id}`} className="flex items-center justify-between rounded border border-slate-700 p-2 hover:border-cyan-500"><span>{change.incident.severity}: {change.incident.shortDesc.slice(0, 45)}</span><ExternalLink className="h-3 w-3" /></Link> : <p className="text-slate-500">Không có incident nguồn</p>}
            </div>
          </section>

          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-4">
            <h2 className="mb-3 text-sm font-semibold">Review ({approvedCount} duyệt / {rejectedCount} từ chối)</h2>
            <div className="space-y-2">{change.approvals.map((approval) => <div key={approval.id} className="rounded border border-slate-700 p-3 text-sm"><div className="flex justify-between gap-2"><strong>{approval.reviewerUser.fullName}</strong><span className={approval.status === "APPROVED" ? "text-emerald-400" : "text-red-400"}>{approval.status}</span></div>{approval.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{approval.notes}</p>}</div>)}{change.approvals.length === 0 && <p className="text-sm text-slate-500">Chưa có review.</p>}</div>
          </section>

          {canManage && nextStatuses.length > 0 && (
            <form className="space-y-3 rounded-md border border-slate-700 bg-slate-900/40 p-4">
              <h2 className="text-sm font-semibold">Chuyển trạng thái</h2>
              <select name="status" defaultValue={nextStatuses[0]} className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm">{nextStatuses.map((status) => <option key={status}>{status}</option>)}</select>
              <button formAction={async (formData) => { "use server"; await updateChangeStatus(change.id, String(formData.get("status") || "")); }} className="h-9 w-full rounded-md bg-cyan-600 px-3 text-sm font-semibold text-white hover:bg-cyan-500">Cập nhật</button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
