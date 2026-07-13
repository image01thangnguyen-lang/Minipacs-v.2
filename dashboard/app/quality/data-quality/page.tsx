import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";
import { requirePermission } from "@/lib/authz";
import { getDataQualityIssues } from "@/lib/dataQualityService";

export default async function DataQualityPage() {
  await requirePermission("dataQuality.read");
  const issues = await getDataQualityIssues();

  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Data Quality</h1>
      <p className="text-vin-muted">Phát hiện dữ liệu bất thường: sai thông tin hành chính hoặc mất đồng bộ HIS.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Cảnh báo dữ liệu</h2>
        </div>
        <div>
          {issues.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Hệ thống dữ liệu đang hoạt động ổn định.</div> : <div className="space-y-2">{issues.map(issue => <div key={issue.id} className="rounded border border-vin-border p-3 text-sm"><strong>{issue.title}</strong><span className="ml-3 text-vin-muted">{issue.status}</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

