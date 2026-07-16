'use client';

import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

import React, { useState, useEffect } from 'react';
import { getRetentionPoliciesAction, createRetentionPolicyAction, dryRunRetentionPolicyAction, executeRetentionRunAction, getRetentionRunsAction } from '@/app/actions/retention-actions';

export default function AdminRetentionPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, rData] = await Promise.all([
        getRetentionPoliciesAction(),
        getRetentionRunsAction()
      ]);
      setPolicies(pData);
      setRuns(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      await createRetentionPolicyAction({
        name: 'Chính sách tự động xoá ảnh cũ (6 tháng)',
        scope: 'DICOM',
        olderThanDays: 180,
        preserveMetadata: true,
        deletePhysicalFiles: false // P2 fix: safe by default
      });
      fetchData();
    } catch (err) {
      alert('Lỗi tạo policy');
    }
  };

  const handleDryRun = async (policyId: string) => {
    try {
      await dryRunRetentionPolicyAction(policyId);
      alert(`Đã hoàn tất quá trình tìm kiếm (Dry Run).`);
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleExecuteRun = async (runId: string) => {
    const phrase = window.prompt('Type "I CONFIRM THIS RETENTION RUN" to execute:');
    if (phrase !== 'I CONFIRM THIS RETENTION RUN') {
      alert('Invalid confirmation phrase');
      return;
    }
    try {
      await executeRetentionRunAction(runId, phrase);
      alert('Thực thi thành công.');
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <div className="flex h-full w-full bg-vin-root font-sans text-vin-text">
      <div className="flex-1 flex flex-col min-w-0 bg-vin-shell border-l border-vin-border">
        <div className="p-4 border-b border-vin-border">
          <ScreenHeader />
        </div>
        <div className="p-4 flex-1 overflow-auto grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">Danh sách chính sách (Policies)</h2>
              <button
                onClick={handleCreatePolicy}
                className="bg-vin-primary text-white px-3 py-1.5 rounded hover:bg-vin-primary-hover text-sm"
              >
                Tạo Policy mẫu
              </button>
            </div>

            {loading ? (
              <p className="text-vin-muted text-sm">Đang tải...</p>
            ) : policies.length === 0 ? (
              <p className="text-vin-muted text-sm">Chưa có chính sách nào được cấu hình.</p>
            ) : (
              <div className="space-y-4">
                {policies.map(p => (
                  <div key={p.id} className="bg-vin-surface border border-vin-border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-vin-muted mb-4">
                      Phạm vi: {p.scope} · Cũ hơn: {p.olderThanDays} ngày · Xóa file: {p.deletePhysicalFiles ? 'Có' : 'Không'}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDryRun(p.id)}
                        className="text-sm border border-blue-500/50 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-500/10"
                      >
                        Chạy mô phỏng (Dry-Run)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">Lịch sử chạy (Runs)</h2>
            </div>
            {loading ? (
              <p className="text-vin-muted text-sm">Đang tải...</p>
            ) : runs.length === 0 ? (
              <p className="text-vin-muted text-sm">Chưa có lượt chạy nào.</p>
            ) : (
              <div className="space-y-4">
                {runs.map(r => (
                  <div key={r.id} className="bg-vin-surface border border-vin-border p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{r.mode} ({r.status})</h3>
                      <p className="text-sm text-vin-muted mt-1 font-mono">
                        Số lượng ảnh hưởng: {r.candidateCount}
                      </p>
                      <p className="text-sm text-vin-muted mt-1">
                        Ngày tạo: {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </p>
                      {r.errorMessage && (
                        <p className="text-sm text-red-400 mt-1 font-semibold">
                          {r.errorMessage}
                        </p>
                      )}
                    </div>
                    {r.mode === 'DRY_RUN' && r.status === 'SUCCESS' && (
                      <button
                        onClick={() => handleExecuteRun(r.id)}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded text-sm font-bold"
                      >
                        Thực thi (Duyệt)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
