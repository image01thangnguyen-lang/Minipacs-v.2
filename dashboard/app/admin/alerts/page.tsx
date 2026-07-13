import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";
import { getAlertRules } from "@/lib/alertService";

export default async function AlertsPage() {
  await requirePermission("alerts.read");
  const rules = await getAlertRules();

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Quy tắc cảnh báo (Alert Rules)</h1>
      <p className="text-vin-muted">Thiết lập các kịch bản cảnh báo khi có vi phạm ngưỡng hoặc sự cố tự động.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách quy tắc</h2>
        </div>
        <div>
          {rules.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Chưa có quy tắc cảnh báo nào được cấu hình.</div> : <div className="space-y-2">{rules.map(rule => <div key={rule.id} className="rounded border border-vin-border p-3 text-sm"><strong>{rule.name}</strong><span className="ml-3 text-vin-muted">{rule.isActive ? "Đang bật" : "Đã tắt"}</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

