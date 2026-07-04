import React, { useState, useEffect } from 'react';
import { viewerApiClient } from '../services/viewerApiClient';

export function MiniPacsActionHistoryPanel({ studyInstanceUid }: { studyInstanceUid: string }) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!studyInstanceUid) return;
    viewerApiClient.get<any>(`/api/viewer/studies/${studyInstanceUid}/action-history`).then(res => {
      if (res.ok && res.data?.success) {
        setLogs(res.data.data);
      }
    });
  }, [studyInstanceUid]);

  return (
    <div style={{ padding: 10, color: '#fff', background: '#111', height: '100%', overflowY: 'auto' }}>
      <h4>Action History</h4>
      {logs.length === 0 && <div>No history found.</div>}
      {logs.map(log => (
        <div key={log.id} style={{ borderBottom: '1px solid #333', padding: '5px 0' }}>
          <div><strong>{log.action}</strong></div>
          <div style={{ fontSize: '0.8em', color: '#888' }}>{new Date(log.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

export default MiniPacsActionHistoryPanel;
