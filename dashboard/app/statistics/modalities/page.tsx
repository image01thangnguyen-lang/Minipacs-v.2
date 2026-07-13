import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";

export default async function ModalitiesAnalyticsPage() {
  await requirePermission("analytics.read");

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Công suất thiết bị (Modality Utilization)</h1>
      <p className="text-vin-muted">Theo dõi thời gian hoạt động, thời gian rảnh và tải của các thiết bị chẩn đoán.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Tỷ lệ sử dụng theo phòng chụp</h2>
        </div>
        <div>
          <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">
            Dữ liệu đang được tổng hợp...
          </div>
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

