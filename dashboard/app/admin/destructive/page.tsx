'use client';

import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

import React, { useState, useEffect } from 'react';
import { getDestructiveRequestsAction, approveDestructiveRequestAction, executeDestructiveRequestAction, dryRunDestructiveRequestAction } from '@/app/actions/destructive-actions';

export default function AdminDestructivePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getDestructiveRequestsAction();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveDestructiveRequestAction(id);
      fetchRequests();
      alert('Đã duyệt yêu cầu thành công.');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDryRun = async (id: string) => {
    try {
      await dryRunDestructiveRequestAction(id);
      fetchRequests();
      alert('Đã chạy mô phỏng (Dry Run). Vui lòng xem kết quả.');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleExecute = async (id: string) => {
    const input = prompt('Nhập cụm từ xác nhận: I CONFIRM THIS DESTRUCTIVE ACTION');
    if (!input) return;
    try {
      await executeDestructiveRequestAction(id, input);
      fetchRequests();
      alert('Đã thực thi thành công.');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div className="flex h-full w-full bg-vin-root font-sans text-vin-text">
      <div className="flex-1 flex flex-col min-w-0 bg-vin-shell border-l border-vin-border">
        <div className="p-4 border-b border-vin-border bg-red-950/20">
          <ScreenHeader />
          <p className="text-sm text-vin-muted mt-1">Yêu cầu xóa dữ liệu cần được duyệt bởi người khác. Không thể tự duyệt yêu cầu của chính mình.</p>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          {loading ? (
            <p className="text-vin-muted text-sm">Đang tải...</p>
          ) : requests.length === 0 ? (
            <p className="text-vin-muted text-sm">Chưa có yêu cầu nào.</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-vin-surface border border-red-900/30 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{req.operationType}</h3>
                      <p className="text-sm text-vin-muted mt-1 font-mono">
                        {req.entityType}: {req.entityId || req.studyInstanceUid || '-'}
                      </p>
                      <p className="text-sm text-red-300 mt-2 bg-red-950/30 p-2 rounded">
                        Lý do: {req.reason}
                      </p>
                      {req.impactSummaryJson && (
                        <div className="mt-2 text-sm bg-vin-root p-2 rounded border border-vin-border">
                          <strong className={JSON.parse(req.impactSummaryJson).safeToDelete ? 'text-green-400' : 'text-red-400'}>
                            Dry Run Result: {JSON.parse(req.impactSummaryJson).safeToDelete ? 'Safe to delete' : 'UNSAFE'}
                          </strong>
                          {JSON.parse(req.impactSummaryJson).warnings?.map((w: string, idx: number) => (
                            <div key={idx} className="text-amber-400 mt-1">- {w}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      req.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                      req.status === 'DRY_RUN_READY' ? 'bg-cyan-500/20 text-cyan-400' :
                      req.status === 'FAILED' || req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end border-t border-vin-border pt-3 mt-1">
                    {req.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleDryRun(req.id)}
                        className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 px-3 py-1.5 rounded text-sm"
                      >
                        Chạy mô phỏng (Dry Run)
                      </button>
                    )}
                    {req.status === 'DRY_RUN_READY' && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded text-sm"
                      >
                        Duyệt yêu cầu
                      </button>
                    )}
                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => handleExecute(req.id)}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded text-sm font-bold"
                      >
                        Thực thi XÓA
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
