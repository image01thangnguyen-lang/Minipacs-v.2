'use client';

import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

import React, { useState, useEffect } from 'react';
import { getBackupJobsAction, createBackupJobAction } from '@/app/actions/backup-actions';

export default function AdminBackupPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getBackupJobsAction();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobType: string) => {
    try {
      await createBackupJobAction({ jobType });
      fetchJobs();
      alert(`Đã tạo yêu cầu ${jobType}.`);
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
        <div className="p-4 flex-1 overflow-auto">
          <div className="flex gap-4 mb-6 border-b border-vin-border pb-4">
            <button
              onClick={() => handleCreateJob('STORAGE_TEST')}
              className="bg-vin-surface border border-vin-border hover:bg-vin-panel text-white px-4 py-2 rounded text-sm"
            >
              Test kết nối Storage
            </button>
            <button
              onClick={() => handleCreateJob('BACKUP_RUN')}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded text-sm"
            >
              Chạy Backup ngay
            </button>
            <button
              onClick={() => handleCreateJob('RESTORE_CHECKLIST')}
              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded text-sm"
            >
              Mở Checklist Khôi phục
            </button>
          </div>

          <h2 className="text-sm font-semibold mb-4">Lịch sử Backup / Test</h2>

          {loading ? (
            <p className="text-vin-muted text-sm">Đang tải...</p>
          ) : jobs.length === 0 ? (
            <p className="text-vin-muted text-sm">Chưa có bản ghi nào.</p>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-vin-surface border border-vin-border p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{job.jobType}</h3>
                    <p className="text-sm text-vin-muted mt-1">
                      Ngày tạo: {new Date(job.createdAt).toLocaleString('vi-VN')}
                    </p>
                    {job.errorMessage && (
                      <p className="text-sm text-red-400 mt-1">Lỗi: {job.errorMessage}</p>
                    )}
                  </div>
                  <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                    job.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                    job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
