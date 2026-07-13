import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";

export default async function WorkloadAnalyticsPage() {
  await requirePermission("analytics.read");

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Khối lượng công việc (Workload)</h1>
      <p className="text-vin-muted">Thống kê năng suất theo bác sĩ, kỹ thuật viên và nhân sự khác.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Bác sĩ đọc kết quả</h2>
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

