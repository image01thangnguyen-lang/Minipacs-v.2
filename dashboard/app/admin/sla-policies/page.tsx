import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";
import { getSlaPolicies } from "@/lib/controlThresholdService";

export default async function SlaPoliciesPage() {
  await requirePermission("thresholds.read");
  const policies = await getSlaPolicies();

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Chính sách SLA / TAT</h1>
      <p className="text-vin-muted">Định nghĩa cam kết thời gian cho từng loại dịch vụ và mức ưu tiên.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách chính sách SLA</h2>
        </div>
        <div>
          {policies.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Chưa có cấu hình chính sách SLA.</div> : <div className="space-y-2">{policies.map(policy => <div key={policy.id} className="rounded border border-vin-border p-3 text-sm"><strong>{policy.name}</strong><span className="ml-3 text-vin-muted">{policy.thresholdMinutes} phút</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

