import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createReleaseCandidate } from "../actions";

export default async function NewReleasePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "release.manage", session.user.permissions)) redirect("/");
  const suites = await prisma.uatSuite.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, version: true } });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header><Link href="/admin/release/go-live" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại Go-Live Center</Link><ScreenHeader /><h1 className="mt-4 text-2xl font-bold">Tạo Release Candidate</h1><p className="mt-1 text-sm text-slate-400">Khởi tạo release và gắn bộ UAT riêng cho phiên bản này.</p></header>
      <form action={async formData => { "use server"; const id = await createReleaseCandidate(formData); redirect(`/admin/release/go-live/${id}`); }} className="space-y-5 rounded-md border border-slate-700 bg-slate-900/40 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Version<input name="version" required maxLength={80} placeholder="v2.1.0-rc.1" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3" /></label>
          <label className="text-sm font-medium">Môi trường<select name="targetEnvironment" defaultValue="STAGING" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option>LOCAL</option><option>STAGING</option><option>PRODUCTION</option></select></label>
        </div>
        <label className="block text-sm font-medium">Tiêu đề<input name="title" required maxLength={160} className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3" placeholder="Phase 10 final acceptance" /></label>
        <label className="block text-sm font-medium">UAT suite<select name="uatSuiteId" defaultValue="" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="">Chọn sau</option>{suites.map(suite => <option key={suite.id} value={suite.id}>{suite.name}{suite.version ? ` (${suite.version})` : ""}</option>)}</select></label>
        <label className="block text-sm font-medium">Phạm vi ban đầu<textarea name="notes" required maxLength={5000} rows={5} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" placeholder="Không nhập PHI hoặc secret." /></label>
        <button type="submit" className="h-10 w-full rounded-md bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-500">Tạo release</button>
      </form>
    </main>
  );
}
