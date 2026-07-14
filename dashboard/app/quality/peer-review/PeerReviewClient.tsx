"use client";

import { PageCanvas, PagePanel } from "@/app/components/ui/PagePrimitives";

export function PeerReviewClient({ reviews }: { reviews: any[] }) {
  return (
    <PageCanvas className="space-y-6 overflow-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Peer Review</h1>
      <p className="text-vin-muted">Thực hiện đánh giá chéo kết quả giữa các bác sĩ và ghi nhận sai lệch chẩn đoán.</p>
      
      <PagePanel className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách ca chờ đánh giá</h2>
        </div>
        <div>
          {reviews.length === 0 ? (
            <div className="rounded-md border border-vin-border p-4 text-center text-sm text-vin-muted">Chưa có ca nào cần đánh giá.</div>
          ) : (
            <div className="space-y-2">{reviews.map(review => <div key={review.id} className="rounded border border-vin-border p-3 text-sm"><strong>{review.studyInstanceUid}</strong><span className="ml-3 text-vin-muted">{review.status}</span></div>)}</div>
          )}
        </div>
      </PagePanel>
    </PageCanvas>
  );
}

