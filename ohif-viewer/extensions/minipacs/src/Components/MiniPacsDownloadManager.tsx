import React, { useState, useEffect } from 'react';
import { viewerApiClient } from '../services/viewerApiClient';

export function MiniPacsDownloadManager() {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = () => {
    viewerApiClient.get<any>('/api/viewer/download-jobs').then(res => {
      if (res.ok && res.data?.success) {
        setJobs(res.data.data);
      }
    });
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    await viewerApiClient.post(`/api/viewer/download-jobs/${id}`, { action: 'CANCEL' });
    fetchJobs();
  };

  return (
    <div style={{ padding: 20, color: '#fff', background: '#222' }}>
      <h3>Download Jobs</h3>
      {jobs.length === 0 && <div>No jobs found.</div>}
      {jobs.map(job => (
        <div key={job.id} style={{ borderBottom: '1px solid #444', padding: '10px 0' }}>
          <div><strong>Type:</strong> {job.jobType}</div>
          <div><strong>Status:</strong> {job.status}</div>
          <div><strong>Study UID:</strong> {job.studyInstanceUid}</div>
          {job.status === 'PENDING' && <button onClick={() => handleCancel(job.id)}>Cancel</button>}
          {job.status === 'SUCCESS' && job.filePath && (
            <a href={job.filePath} download={job.fileName} style={{ color: '#4da6ff', textDecoration: 'underline' }}>
              Download {job.fileName} ({(job.fileSizeBytes / 1024 / 1024).toFixed(2)} MB)
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default MiniPacsDownloadManager;
