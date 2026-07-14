"use client";

import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";

export function QcRejectsClient({ issues }: { issues: any[] }) {
  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">QC Rejects (Lỗi chụp lại)</h1>
      <p className="text-vin-muted">Quản lý các ca bị đánh giá lỗi kỹ thuật và yêu cầu chụp lại.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách ca bị từ chối QC</h2>
        </div>
        <div>
          {issues.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Chưa có ca nào bị từ chối QC.</div> : <div className="space-y-2">{issues.map(issue => <div key={issue.id} className="rounded border border-vin-border p-3 text-sm"><strong>{issue.studyInstanceUid || issue.nonDicomExamId || issue.id}</strong><span className="ml-3 text-vin-muted">{issue.status} – {issue.reasonCode}</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}
