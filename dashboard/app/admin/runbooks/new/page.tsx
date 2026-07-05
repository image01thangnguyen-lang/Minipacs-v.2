import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createRunbook } from "../actions";

export default async function NewRunbookPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!hasPermission(session.user.role, "runbook.manage", session.user.permissions)) redirect("/admin/runbooks");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header><Link href="/admin/runbooks" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"><ArrowLeft className="h-4 w-4" /> Quay lại thư viện</Link><h1 className="mt-4 text-2xl font-bold">Tạo Runbook</h1><p className="mt-1 text-sm text-slate-400">Tạo khung quy trình; các step được thêm sau khi lưu.</p></header>
      <form action={async (formData) => { "use server"; const id = await createRunbook(formData); redirect(`/admin/runbooks/${id}`); }} className="space-y-5 rounded-md border border-slate-700 bg-slate-900/40 p-6">
        <label className="block text-sm font-medium">Tên runbook<input name="name" required maxLength={160} className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3" placeholder="Ví dụ: Deploy phiên bản mới" /></label>
        <label className="block text-sm font-medium">Mô tả<textarea name="description" maxLength={3000} rows={4} className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-3" /></label>
        <label className="block text-sm font-medium">Danh mục<select name="category" defaultValue="MAINTENANCE" className="mt-1 h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3"><option value="DEPLOYMENT">Deployment</option><option value="MAINTENANCE">Maintenance</option><option value="INCIDENT_RESPONSE">Incident Response</option></select></label>
        <label className="flex items-start gap-3 rounded-md border border-amber-800 bg-amber-950/30 p-3 text-sm"><input name="dataSafetyAttestation" type="checkbox" required className="mt-1" /><span>Tôi xác nhận runbook không chứa PHI, mật khẩu, token hoặc giá trị secret. Chỉ được ghi tên biến môi trường.</span></label>
        <button type="submit" className="h-10 w-full rounded-md bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-500">Tạo runbook</button>
      </form>
    </main>
  );
}
