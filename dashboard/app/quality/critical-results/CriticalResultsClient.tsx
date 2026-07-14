"use client";

import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";

export function CriticalResultsClient({ results }: { results: any[] }) {
  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Critical Results</h1>
      <p className="text-vin-muted">Quản lý các kết quả nguy hiểm cần thông báo lâm sàng khẩn cấp.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Kết quả nguy hiểm đang theo dõi</h2>
        </div>
        <div>
          {results.length === 0 ? <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Không có kết quả nguy hiểm nào cần xử lý.</div> : <div className="space-y-2">{results.map(result => <div key={result.id} className="rounded border border-vin-border p-3 text-sm"><strong>{result.imagingStudyId}</strong><span className="ml-3 text-vin-muted">{result.communicationStatus}</span></div>)}</div>}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

