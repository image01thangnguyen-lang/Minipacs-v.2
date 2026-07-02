import { viewerApiClient } from './viewerApiClient';

export const viewerAuditService = {
  recordAction(studyInstanceUid: string, action: string, metadata?: Record<string, any>) {
    if (studyInstanceUid === null || studyInstanceUid === undefined) return;
    
    // Backend rejects empty string. Use a sentinel value for global actions without a study context.
    const safeUid = studyInstanceUid.trim() === '' ? 'GLOBAL_ACTION' : studyInstanceUid;

    viewerApiClient.post('/api/audit/viewer-action', {
      studyInstanceUid: safeUid,
      action,
      metadata
    }).catch(err => {
      // Ignore errors to not crash the viewer
      console.warn('Audit log failed silently:', err);
    });
  }
};
