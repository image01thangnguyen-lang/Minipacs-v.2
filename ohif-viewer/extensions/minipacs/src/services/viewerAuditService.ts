import { viewerApiClient } from './viewerApiClient';

export type ViewerAuditAction =
  | 'viewer_opened'
  | 'series_selected'
  | 'layout_changed'
  | 'fullscreen_toggled'
  | 'snapshot_opened'
  | 'key_image_saved'
  | 'history_opened'
  | 'report_link_opened'
  | 'backend_action_attempted';

class ViewerAuditService {
  /**
   * Fire and forget audit recording. Does not block or show toasts on failure.
   */
  recordAction(action: ViewerAuditAction, studyInstanceUid?: string, metadata?: Record<string, any>) {
    viewerApiClient.post('/api/audit/viewer-action', {
      action,
      studyInstanceUid,
      metadata,
      timestamp: new Date().toISOString(),
    }).catch(err => {
      // Fail silently to avoid spamming the user
      console.debug('[ViewerAuditService] Audit failed', err);
    });
  }
}

export const viewerAuditService = new ViewerAuditService();
