import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";
import { getTatAnalytics } from "@/lib/tatAnalyticsService";

export default async function SlaAnalyticsPage() {
  await requirePermission("analytics.read");
  const tat = await getTatAnalytics();

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">SLA & Thời gian quay vòng (TAT)</h1>
      <p className="text-vin-muted">Phân tích thời gian trung bình giữa các bước trong quy trình vận hành hôm nay ({tat.totalCount} ca).</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PagePanel className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">Check-in đến chụp</h2>
          </div>
          <div>
            <div className="text-2xl font-bold">{tat.checkinToScanAvg} phút</div>
          </div>
        </PagePanel>
        <PagePanel className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">Chụp đến gửi PACS</h2>
          </div>
          <div>
            <div className="text-2xl font-bold">{tat.scanToReceivedAvg} phút</div>
          </div>
        </PagePanel>
        <PagePanel className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">PACS đến đọc</h2>
          </div>
          <div>
            <div className="text-2xl font-bold">{tat.receivedToReadAvg} phút</div>
          </div>
        </PagePanel>
        <PagePanel className="p-4">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">Đọc đến ký duyệt</h2>
          </div>
          <div>
            <div className="text-2xl font-bold">{tat.readToFinalAvg} phút</div>
          </div>
        </PagePanel>
      </div>
      
      {/* Charts placeholder */}
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Biểu đồ TAT theo ngày</h2>
        </div>
        <div className="flex h-[300px] items-center justify-center border-t border-vin-border text-vin-muted">
          Chưa đủ dữ liệu chuỗi thời gian.
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

