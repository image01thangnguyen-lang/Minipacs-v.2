'use client';

import React, { useState, useEffect } from 'react';
import { getMyExportJobsAction, cancelExportJobAction } from '@/app/actions/export-actions';

export function DownloadManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const data = await getMyExportJobsAction();
        if (mounted) setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchJobs();

    // Poll every 10 seconds while open
    const interval = setInterval(fetchJobs, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleCancel = async (jobId: string) => {
    try {
      await cancelExportJobAction(jobId);
      // Optimistic update
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'CANCELLED' } : j));
    } catch (err) {
      alert('Không thể huỷ job này.');
    }
  };

  const handleDownload = (token: string) => {
    window.location.href = `/api/exports/download/${token}`;
  };

  const activeCount = jobs.filter(j => j.status === 'PENDING' || j.status === 'RUNNING').length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-vin-primary text-white p-3 rounded-full shadow-lg hover:bg-vin-primary-hover transition-colors z-50 flex items-center justify-center group"
        title="Quản lý tải xuống"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-vin-shell shadow-2xl border-l border-vin-border z-[60] flex flex-col">
          <div className="p-4 border-b border-vin-border flex justify-between items-center bg-vin-surface">
            <h2 className="text-lg font-semibold text-white">Quản lý tải xuống</h2>
            <button onClick={() => setIsOpen(false)} className="text-vin-muted hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && jobs.length === 0 && <p className="text-vin-muted text-sm text-center">Đang tải...</p>}
            {!loading && jobs.length === 0 && <p className="text-vin-muted text-sm text-center">Chưa có bản ghi nào.</p>}

            {jobs.map(job => (
              <div key={job.id} className="bg-vin-surface p-3 rounded border border-vin-border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-white truncate pr-2" title={job.jobType}>
                    {job.jobType.replace('_', ' ')}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    job.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                    job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                    job.status === 'CANCELLED' ? 'bg-gray-500/20 text-gray-400' :
                    job.status === 'EXPIRED' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-xs text-vin-muted mb-2">Scope: {job.scope}</p>
                {job.anonymize && (
                  <p className="text-xs text-blue-400 mb-2 font-medium">Ẩn thông tin cơ bản / PHI-safe</p>
                )}

                {job.status === 'RUNNING' && (
                  <div className="w-full bg-vin-root rounded-full h-1.5 mb-2">
                    <div className="bg-vin-primary h-1.5 rounded-full" style={{ width: `${job.progress}%` }}></div>
                  </div>
                )}

                <div className="flex justify-between mt-3">
                  {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Huỷ
                    </button>
                  )}
                  {job.status === 'SUCCESS' && job.downloadTokenHash && (
                    <button
                      onClick={() => handleDownload(job.downloadTokenHash)}
                      className="text-xs text-vin-primary hover:text-vin-primary-hover font-medium"
                    >
                      Tải xuống
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
