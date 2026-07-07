import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { acceptHandoff, getReleaseReadiness, markHandoffReady, saveHandoffRecord } from "../../actions";

const CHECKS = [
  ["buildPassed", "Production build đã pass"],
  ["typecheckPassed", "Type-check đã pass"],
  ["prismaValidated", "Prisma schema đã validate/generate"],
  ["migrationReviewed", "Migration đã được review và có kế hoạch deploy"],
  ["seedVerified", "Seed/permission đã được đồng bộ"],
  ["manualSmokeCompleted", "Manual smoke/UAT scenarios đã chạy"],
  ["docsUpdated", "Tài liệu triển khai/vận hành đã cập nhật"],
  ["rollbackReviewed", "Rollback plan đã được diễn tập hoặc review"],
  ["monitoringReviewed", "Monitoring, log và incident escalation đã xác nhận"],
  ["noPhiAttested", "Evidence/handoff không chứa PHI hoặc secret"],
] as const;

export default async function ReleaseHandoffPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "release.read", session.user.permissions)) redirect("/");
  const canManage = hasPermission(session.user.role, "release.manage", session.user.permissions);
  const canAccept = hasPermission(session.user.role, "release.signoff", session.user.permissions);
  const [release, readiness] = await Promise.all([
    prisma.releaseCandidate.findUnique({ where: { id: params.id }, include: { handoff: { include: { preparedByUser: { select: { fullName: true } }, acceptedByUser: { select: { fullName: true } } } }, uatSuite: { select: { name: true } } } }),
    getReleaseReadiness(params.id),
  ]);
  if (!release) notFound();
  const handoff = release.handoff;
  const editable = canManage && !["RELEASED", "ROLLED_BACK"].includes(release.status) && handoff?.status !== "ACCEPTED";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="border-b border-slate-700 pb-5"><Link href={`/admin/release/go-live/${release.id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại release</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><ScreenHeader /><h1 className="mt-4 text-2xl font-bold">QA &amp; Operations Handoff</h1><p className="mt-1 text-sm text-slate-400">{release.version} · {release.title} · {release.targetEnvironment}</p></div><span className="rounded bg-cyan-950 px-3 py-1 text-sm font-bold text-cyan-300">{handoff?.status || "MISSING"}</span></div></header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/release/uat" className="rounded-md border border-slate-700 p-3 text-sm hover:border-cyan-500"><span className="text-slate-400">UAT</span><strong className="mt-1 block">{readiness.latestUat?.status || "MISSING"}</strong></Link>
        <Link href="/admin/ops/health" className="rounded-md border border-slate-700 p-3 text-sm hover:border-cyan-500"><span className="text-slate-400">Health</span><strong className="mt-1 block">{readiness.checks.health.status}</strong></Link>
        <Link href="/admin/ops/security" className="rounded-md border border-slate-700 p-3 text-sm hover:border-cyan-500"><span className="text-slate-400">Security</span><strong className="mt-1 block">{readiness.checks.security.status}</strong></Link>
        <Link href="/admin/ops/deployment" className="rounded-md border border-slate-700 p-3 text-sm hover:border-cyan-500"><span className="text-slate-400">Deployment readiness</span><strong className="mt-1 flex items-center gap-1">Mở checklist <ExternalLink className="h-3 w-3" /></strong></Link>
      </section>

      <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">Final QA Checklist</h2>
        {editable ? (
          <form action={async formData => { "use server"; await saveHandoffRecord(release.id, formData); }} className="mt-4 space-y-5">
            <div className="grid gap-3 md:grid-cols-2">{CHECKS.map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-md border border-slate-700 p-3 text-sm"><input type="checkbox" name={key} defaultChecked={handoff?.[key] || false} className="mt-1" /><span>{label}</span></label>)}</div>
            <div className="grid gap-4 md:grid-cols-3"><label className="text-sm">Operations owner<input name="operationsOwner" defaultValue={handoff?.operationsOwner || ""} required maxLength={160} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label><label className="text-sm">Support contact<input name="supportContact" defaultValue={handoff?.supportContact || ""} required maxLength={200} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label><label className="text-sm">Rollback owner<input name="rollbackOwner" defaultValue={handoff?.rollbackOwner || ""} required maxLength={160} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label></div>
            <label className="block text-sm">QA summary<textarea name="qaSummary" defaultValue={handoff?.qaSummary || ""} required maxLength={5000} rows={4} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" placeholder="Các scenario đã chạy, kết quả và giới hạn còn lại. Không nhập PHI." /></label>
            <label className="block text-sm">Operations handoff summary<textarea name="handoffSummary" defaultValue={handoff?.handoffSummary || ""} required maxLength={5000} rows={4} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" placeholder="Deploy, migration, monitoring, support và rollback." /></label>
            <button type="submit" className="h-9 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white">Lưu hồ sơ</button>
          </form>
        ) : (
          <div className="mt-4 space-y-5"><div className="grid gap-2 md:grid-cols-2">{CHECKS.map(([key, label]) => <div key={key} className="flex items-center gap-2 rounded-md border border-slate-700 p-3 text-sm"><CheckCircle className={`h-4 w-4 ${handoff?.[key] ? "text-emerald-400" : "text-slate-600"}`} /> {label}</div>)}</div><div><h3 className="font-semibold">QA summary</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{handoff?.qaSummary || "Chưa có"}</p></div><div><h3 className="font-semibold">Handoff summary</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{handoff?.handoffSummary || "Chưa có"}</p></div></div>
        )}
      </section>

      <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="font-semibold">Approval trail</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded border border-slate-700 p-3 text-sm"><span className="text-slate-400">Prepared by</span><strong className="mt-1 block">{handoff?.preparedByUser?.fullName || "-"}</strong><p className="text-xs text-slate-500">{handoff?.preparedAt?.toLocaleString("vi-VN") || ""}</p></div><div className="rounded border border-slate-700 p-3 text-sm"><span className="text-slate-400">Accepted by</span><strong className="mt-1 block">{handoff?.acceptedByUser?.fullName || "-"}</strong><p className="text-xs text-slate-500">{handoff?.acceptedAt?.toLocaleString("vi-VN") || ""}</p></div></div>
        <div className="mt-4 flex gap-3">{canManage && handoff?.status === "DRAFT" && <form><button formAction={async () => { "use server"; await markHandoffReady(release.id); }} className="h-9 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">Đánh dấu READY</button></form>}{canAccept && release.status === "RELEASED" && handoff?.status === "READY" && <form><button formAction={async () => { "use server"; await acceptHandoff(release.id); }} className="h-9 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white">Chấp nhận handoff</button></form>}</div>
      </section>
    </main>
  );
}
