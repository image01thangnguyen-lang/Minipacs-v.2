import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";
import { getControlThresholdPolicies } from "@/lib/controlThresholdService";

export default async function ControlThresholdsPage() {
  await requirePermission("thresholds.read");
  const policies = await getControlThresholdPolicies();

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Ngưỡng kiểm soát (Control Thresholds)</h1>
      <p className="text-vin-muted">Cấu hình ngưỡng cảnh báo tự động khi có dấu hiệu bất thường.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách ngưỡng hiện tại</h2>
        </div>
        <div>
          {policies.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Chưa có cấu hình ngưỡng kiểm soát.</div> : <div className="space-y-2">{policies.map(policy => <div key={policy.id} className="rounded border border-vin-border p-3 text-sm"><strong>{policy.name}</strong><span className="ml-3 text-vin-muted">{policy.metricKey}</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

