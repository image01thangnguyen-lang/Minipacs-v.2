import { viewerApiClient } from './viewerApiClient';

export const viewerAuditService = {
  recordAction(studyInstanceUid: string, action: string, metadata?: Record<string, any>) {
    if (!studyInstanceUid) return;
    
    // Fire and forget
    viewerApiClient.post('/api/audit/viewer-action', {
      studyInstanceUid,
      action,
      metadata
    }).catch(err => {
      // Ignore errors to not crash the viewer
      console.warn('Audit log failed silently:', err);
    });
  }
};
