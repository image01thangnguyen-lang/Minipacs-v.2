import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft, ClipboardCheck, Lock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addKnownIssue, getReleaseReadiness, updateKnownIssueStatus, updateReleaseMetadata } from "../actions";
import { GO_LIVE_SIGNOFF_ROLES } from "../constants";
import GoLiveCommandPanel, { type SignOffView } from "./GoLiveCommandPanel";

export default async function GoLiveCommandCenterPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "release.read", session.user.permissions)) redirect("/");
  const canSignOff = hasPermission(session.user.role, "release.signoff", session.user.permissions);
  const canManage = hasPermission(session.user.role, "release.manage", session.user.permissions);

  const [release, readiness, suites] = await Promise.all([
    prisma.releaseCandidate.findUnique({
      where: { id: params.id },
      include: {
        createdByUser: { select: { fullName: true } },
        lockedByUser: { select: { fullName: true } },
        uatSuite: { select: { id: true, name: true, version: true } },
        handoff: { include: { preparedByUser: { select: { fullName: true } }, acceptedByUser: { select: { fullName: true } } } },
        signOffs: { include: { signedByUser: { select: { fullName: true } } } },
        knownIssues: { include: { acceptedByUser: { select: { fullName: true } } }, orderBy: [{ riskLevel: "desc" }, { createdAt: "desc" }] },
      },
    }),
    getReleaseReadiness(params.id),
    canManage ? prisma.uatSuite.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, version: true } }) : [],
  ]);
  if (!release) notFound();

  const roles = [...GO_LIVE_SIGNOFF_ROLES];
  const signOffs = roles.reduce<Record<string, SignOffView>>((record, role) => {
    const signoff = release.signOffs.find(item => item.role === role);
    record[role] = signoff ? { role, status: signoff.status, notes: signoff.notes, evidenceUrl: signoff.evidenceUrl, signedAt: signoff.signedAt?.toISOString() || null, signedByName: signoff.signedByUser?.fullName || null } : { role, status: "PENDING" };
    return record;
  }, {});
  const canEditMetadata = canManage && !release.lockedAt && ["DRAFT", "TESTING", "BLOCKED"].includes(release.status);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <header className="border-b border-slate-700 pb-5">
        <Link href="/admin/release/go-live" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold">{release.version}: {release.title || "Untitled release"}</h1><p className="mt-1 text-sm text-slate-400">{release.targetEnvironment} · tạo bởi {release.createdByUser?.fullName || "System"} · {release.createdAt.toLocaleString("vi-VN")}</p>{release.lockedAt && <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300"><Lock className="h-3 w-3" /> Khóa lúc {release.lockedAt.toLocaleString("vi-VN")} bởi {release.lockedByUser?.fullName || "System"}</p>}</div>
          <span className="rounded bg-blue-950 px-3 py-1.5 text-sm font-bold text-blue-300">{release.status}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Build & Release Metadata</h2><p className="text-sm text-slate-400">Nội dung bị khóa khi bắt đầu sign-off.</p></div></div>
            {canEditMetadata ? (
              <form action={async formData => { "use server"; await updateReleaseMetadata(release.id, formData); }} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3"><label className="text-sm">Tiêu đề<input name="title" defaultValue={release.title} required className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label><label className="text-sm">Môi trường<select name="targetEnvironment" defaultValue={release.targetEnvironment} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2"><option>LOCAL</option><option>STAGING</option><option>PRODUCTION</option></select></label><label className="text-sm">UAT suite<select name="uatSuiteId" defaultValue={release.uatSuiteId || ""} required className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2"><option value="">Chọn suite</option>{suites.map(suite => <option key={suite.id} value={suite.id}>{suite.name}{suite.version ? ` (${suite.version})` : ""}</option>)}</select></label></div>
                <div className="grid gap-3 md:grid-cols-3"><label className="text-sm">Git commit<input name="gitCommit" defaultValue={release.gitCommit || ""} required maxLength={80} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label><label className="text-sm">Image tag<input name="imageTag" defaultValue={release.imageTag || ""} required maxLength={160} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label><label className="text-sm">Build checksum<input name="buildChecksum" defaultValue={release.buildChecksum || ""} required maxLength={160} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2" /></label></div>
                <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Migration status<select name="migrationStatus" defaultValue={release.migrationStatus} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2"><option>UNKNOWN</option><option>PENDING</option><option>APPLIED</option><option>FAILED</option></select></label><label className="text-sm">Seed status<select name="seedStatus" defaultValue={release.seedStatus} className="mt-1 h-9 w-full rounded-md border border-slate-600 bg-slate-950 px-2"><option>UNKNOWN</option><option>PENDING</option><option>APPLIED</option><option>FAILED</option></select></label></div>
                <label className="block text-sm">Phạm vi<textarea name="notes" defaultValue={release.notes || ""} required maxLength={5000} rows={3} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2" /></label>
                <label className="block text-sm">Release notes<textarea name="releaseNotes" defaultValue={release.releaseNotes || ""} required maxLength={10000} rows={5} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2" /></label>
                <label className="block text-sm">Rollback plan<textarea name="rollbackPlan" defaultValue={release.rollbackPlan || ""} required maxLength={5000} rows={4} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2" /></label>
                <button type="submit" className="h-9 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white">Lưu metadata</button>
              </form>
            ) : (
              <div className="space-y-4 text-sm"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><p><span className="text-slate-500">Git:</span> {release.gitCommit || "-"}</p><p><span className="text-slate-500">Image:</span> {release.imageTag || "-"}</p><p><span className="text-slate-500">Checksum:</span> {release.buildChecksum || "-"}</p><p><span className="text-slate-500">Migration:</span> {release.migrationStatus}</p><p><span className="text-slate-500">Seed:</span> {release.seedStatus}</p><p><span className="text-slate-500">UAT:</span> {release.uatSuite?.name || "-"}</p></div><div><h3 className="font-semibold">Release notes</h3><p className="mt-1 whitespace-pre-wrap text-slate-300">{release.releaseNotes || "Chưa có"}</p></div><div><h3 className="font-semibold">Rollback plan</h3><p className="mt-1 whitespace-pre-wrap text-slate-300">{release.rollbackPlan || "Chưa có"}</p></div></div>
            )}
          </section>

          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold">Known Issues</h2>
            <div className="mt-4 space-y-3">{release.knownIssues.map(issue => <div key={issue.id} className="rounded-md border border-slate-700 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{issue.riskLevel}: {issue.description}</strong><span className="rounded bg-slate-800 px-2 py-0.5 text-xs">{issue.status}</span></div>{issue.workaround && <p className="mt-2 text-slate-400">Workaround: {issue.workaround}</p>}{issue.acceptanceNotes && <p className="mt-2 text-xs text-slate-400">Acceptance: {issue.acceptanceNotes} · {issue.acceptedByUser?.fullName || "-"}</p>}{canManage && <form action={async formData => { "use server"; await updateKnownIssueStatus(issue.id, String(formData.get("status") || ""), String(formData.get("notes") || "")); }} className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr_auto]"><select name="status" defaultValue={issue.status} className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-xs"><option>OPEN</option><option>ACCEPTED</option><option>RESOLVED</option></select><input name="notes" defaultValue={issue.acceptanceNotes || ""} placeholder="Ghi chú bắt buộc khi ACCEPTED" className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-xs" /><button className="h-8 rounded-md border border-slate-600 px-3 text-xs">Cập nhật</button></form>}</div>)}{!release.knownIssues.length && <p className="text-sm text-slate-500">Không có known issue.</p>}</div>
            {canEditMetadata && <form action={async formData => { "use server"; await addKnownIssue(release.id, formData); }} className="mt-4 grid gap-2 border-t border-slate-700 pt-4 md:grid-cols-[120px_1fr_1fr_100px_auto]"><select name="riskLevel" defaultValue="MEDIUM" className="h-9 rounded-md border border-slate-600 bg-slate-950 px-2 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select><input name="description" required maxLength={3000} placeholder="Mô tả đã scrub" className="h-9 rounded-md border border-slate-600 bg-slate-950 px-2 text-sm" /><input name="workaround" maxLength={3000} placeholder="Workaround" className="h-9 rounded-md border border-slate-600 bg-slate-950 px-2 text-sm" /><input name="ticketId" maxLength={64} placeholder="Ticket ID" className="h-9 rounded-md border border-slate-600 bg-slate-950 px-2 text-sm" /><button className="h-9 rounded-md bg-slate-700 px-3 text-sm">Thêm</button></form>}
          </section>

          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-5"><h2 className="mb-2 text-lg font-semibold">Final Sign-Off</h2><p className="mb-5 text-sm text-slate-400">Bốn vai trò phải ký độc lập; readiness snapshot và evidence được lưu cùng chữ ký.</p><GoLiveCommandPanel releaseId={release.id} version={release.version} roles={roles} signOffs={signOffs} canSignOff={canSignOff} canManage={canManage} currentStatus={release.status} blockers={readiness.blockers} /></section>
        </div>

        <aside className="space-y-5">
          <Link href={`/admin/release/go-live/${release.id}/handoff`} className="block rounded-md border border-cyan-800 bg-cyan-950/20 p-4 hover:border-cyan-500"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-cyan-300" /><h2 className="font-semibold">QA & Operations Handoff</h2></div><p className="mt-2 text-sm text-slate-400">Trạng thái: <strong className="text-cyan-300">{release.handoff?.status || "MISSING"}</strong></p>{release.handoff?.preparedByUser && <p className="mt-1 text-xs text-slate-500">Chuẩn bị bởi {release.handoff.preparedByUser.fullName}</p>}</Link>
          <section className="rounded-md border border-slate-700 bg-slate-900/40 p-4"><h2 className="mb-3 text-sm font-semibold">System Readiness</h2><div className="space-y-2 text-sm">{Object.entries(readiness.checks).map(([key, check]) => <div key={key} className="flex justify-between gap-3"><span className="capitalize text-slate-400">{key}</span><span className={check.ok ? "text-emerald-400" : "text-amber-400"}>{check.status}{check.stale ? " / STALE" : ""}</span></div>)}<div className="flex justify-between"><span className="text-slate-400">UAT</span><span className={readiness.blockers.uatFailures || readiness.blockers.uatPending || readiness.blockers.uatMissing ? "text-red-400" : "text-emerald-400"}>{readiness.latestUat?.status || "MISSING"}</span></div><div className="flex justify-between"><span className="text-slate-400">Incident SEV1/2</span><span>{readiness.blockers.incidents}</span></div><div className="flex justify-between"><span className="text-slate-400">Security P0/1</span><span>{readiness.blockers.securityFindings}</span></div></div></section>
        </aside>
      </div>
    </main>
  );
}
