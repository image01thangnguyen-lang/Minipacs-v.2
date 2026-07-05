import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createChangeRequest } from "../actions";

const MODULES = ["GENERAL", "WORKFLOW", "PERMISSIONS", "REPORTING", "HIS", "VIEWER", "STORAGE", "INTEGRATION", "UI", "SECURITY"];

export default async function NewChangeRequestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const canCreate = hasPermission(session.user.role, "change.request", session.user.permissions)
    || hasPermission(session.user.role, "change.manage", session.user.permissions);
  if (!canCreate) redirect("/admin/changes");

  const [releases, suites, incidents] = await Promise.all([
    prisma.releaseCandidate.findMany({ where: { status: { notIn: ["RELEASED", "ROLLED_BACK"] } }, orderBy: { createdAt: "desc" }, select: { id: true, version: true, status: true } }),
    prisma.uatSuite.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, version: true } }),
    prisma.incidentTicket.findMany({ where: { status: { in: ["OPEN", "INVESTIGATING"] } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, severity: true, shortDesc: true } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header>
        <Link href="/admin/changes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại board</Link>
        <h1 className="mt-4 text-2xl font-bold">Tạo Change Request</h1>
        <p className="mt-1 text-sm text-slate-400">Không nhập PHI, nội dung báo cáo, token, mật khẩu hoặc secret.</p>
      </header>

      <form action={async (formData) => { "use server"; const id = await createChangeRequest(formData); redirect(`/admin/changes/${id}`); }} className="space-y-5 rounded-md border border-slate-700 bg-slate-900/40 p-6">
        <label className="block text-sm font-medium">Tiêu đề
          <input name="title" required maxLength={160} className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3" placeholder="Ví dụ: Thay đổi luồng duyệt báo cáo" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">Phân hệ
            <select name="module" defaultValue="GENERAL" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3">{MODULES.map((module) => <option key={module}>{module}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">Mức rủi ro
            <select name="riskLevel" defaultValue="MEDIUM" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select>
          </label>
        </div>
        <label className="block text-sm font-medium">Mô tả thay đổi
          <textarea name="description" required maxLength={5000} rows={5} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" />
        </label>
        <label className="block text-sm font-medium">Tác động dự kiến
          <textarea name="impactSummary" required maxLength={3000} rows={3} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" />
        </label>
        <label className="block text-sm font-medium">Kế hoạch rollback <span className="text-slate-400">(bắt buộc với HIGH)</span>
          <textarea name="rollbackPlan" maxLength={3000} rows={3} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" />
        </label>
        <label className="block text-sm font-medium">Ảnh hưởng release note <span className="text-slate-400">(bắt buộc với HIGH)</span>
          <textarea name="releaseNotesImpact" maxLength={2000} rows={2} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium">Release mục tiêu
            <select name="releaseId" defaultValue="" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="">Không liên kết</option>{releases.map((release) => <option key={release.id} value={release.id}>{release.version} ({release.status})</option>)}</select>
          </label>
          <label className="block text-sm font-medium">Bộ UAT
            <select name="uatSuiteId" defaultValue="" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="">Không liên kết</option>{suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}{suite.version ? ` (${suite.version})` : ""}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">Incident nguồn
            <select name="incidentId" defaultValue="" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="">Không liên kết</option>{incidents.map((incident) => <option key={incident.id} value={incident.id}>{incident.severity}: {incident.shortDesc.slice(0, 50)}</option>)}</select>
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-md border border-slate-700 p-3 text-sm"><input name="uatRequired" type="checkbox" className="mt-1" /><span>Thay đổi này cần chạy UAT trước khi phát hành.</span></label>
        <label className="flex items-start gap-3 rounded-md border border-amber-800 bg-amber-950/30 p-3 text-sm"><input name="dataSafetyAttestation" type="checkbox" required className="mt-1" /><span>Tôi xác nhận nội dung không chứa PHI, định danh bệnh nhân, mật khẩu, token hoặc secret.</span></label>
        <button type="submit" className="h-10 w-full rounded-md bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-500">Gửi Change Request</button>
      </form>
    </main>
  );
}
