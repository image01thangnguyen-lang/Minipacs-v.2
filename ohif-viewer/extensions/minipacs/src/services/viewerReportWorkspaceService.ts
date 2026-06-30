import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';
import { viewerAuditService } from './viewerAuditService';

export type ViewerReportWorkspaceResponse = {
  studyInstanceUid: string;
  report: {
    id: string | null;
    status: 'none' | 'draft' | 'final' | 'completed' | string;
    url: string;
    canRead: boolean;
    canWrite: boolean;
    findingsPreview?: string;
    conclusionPreview?: string;
    updatedAt?: string;
    doctorName?: string;
  };
  measurements: Array<{
    measurementUID: string;
    toolName: string;
    label?: string;
    seriesInstanceUid?: string;
    sopInstanceUid?: string;
    frameNumber?: number;
    summaryText: string;
    valueText?: string;
    unit?: string;
    isSafeForReport: boolean;
    unsafeReason?: string;
  }>;
  keyImages: Array<{
    id: string;
    label?: string;
    thumbnailUrl?: string;
    seriesInstanceUid?: string;
    sopInstanceUid?: string;
  }>;
  snapshots: Array<{
    id: string;
    label?: string;
    imageUrl?: string;
    createdAt?: string;
  }>;
};

class ViewerReportWorkspaceService {
  async loadWorkspace(studyInstanceUid: string): Promise<ViewerReportWorkspaceResponse | null> {
    const result = await viewerApiClient.get<ViewerReportWorkspaceResponse>(`/api/viewer/studies/${studyInstanceUid}/report-workspace`);
    if (!result.ok) {
      commandFeedbackService.show(`Loi: ${result.message}`, 'warning');
      return null;
    }
    
    // Audit client side
    viewerAuditService.recordAction(studyInstanceUid, 'report_workspace_opened');
    return result.data || null;
  }

  async sendMeasurements(studyInstanceUid: string, measurementUIDs: string[], mode: 'append_findings' | 'replace_measurement_section') {
    commandFeedbackService.show('Dang gui do dac vao bao cao...', 'info');
    
    const result = await viewerApiClient.post<{ success: boolean, message: string, requiresAddendum?: boolean, status?: string }>(
      `/api/viewer/studies/${studyInstanceUid}/report-workspace/measurements`,
      { measurementUIDs, mode }
    );
    
    if (!result.ok || result.data?.success === false) {
      const data = result.data || {};
      if (data.requiresAddendum) {
        commandFeedbackService.show(data.message || 'Bao cao da final, hay tao phu luc.', 'warning');
        return { success: false, requiresAddendum: true };
      }
      commandFeedbackService.show(`Loi: ${data.message || result.message}`, 'warning');
      return { success: false };
    }
    
    commandFeedbackService.show('Da cap nhat bao cao thanh cong.', 'success');
    return { success: true };
  }

  async sendKeyImages(studyInstanceUid: string, imageIds: string[], mode: 'append_images' | 'replace_image_section') {
    commandFeedbackService.show('Dang gui anh vao bao cao...', 'info');
    
    const result = await viewerApiClient.post<{ success: boolean, message: string, requiresAddendum?: boolean, status?: string }>(
      `/api/viewer/studies/${studyInstanceUid}/report-workspace/key-images`,
      { imageIds, mode }
    );
    
    if (!result.ok || result.data?.success === false) {
      const data = result.data || {};
      if (data.requiresAddendum) {
        commandFeedbackService.show(data.message || 'Bao cao da final, hay tao phu luc.', 'warning');
        return { success: false, requiresAddendum: true };
      }
      commandFeedbackService.show(`Loi: ${data.message || result.message}`, 'warning');
      return { success: false };
    }
    
    commandFeedbackService.show('Da cap nhat anh vao bao cao thanh cong.', 'success');
    return { success: true };
  }

  async exportDicomSR(studyInstanceUid: string) {
    commandFeedbackService.show('Dang kiem tra kha nang xuat DICOM SR...', 'info');
    
    const result = await viewerApiClient.post<{ success: boolean, message?: string, status?: string }>(
      `/api/viewer/studies/${studyInstanceUid}/dicom-sr/export`,
      {}
    );
    
    if (!result.ok || result.data?.success === false) {
      const data = result.data || {};
      if (data.status === 'deferred') {
         commandFeedbackService.show('Xuat DICOM SR chua san sang (thieu map SOP).', 'info');
         return { success: false, deferred: true };
      }
      commandFeedbackService.show(`Loi: ${data.message || result.message}`, 'warning');
      return { success: false };
    }
    
    commandFeedbackService.show('Da xuat DICOM SR.', 'success');
    return { success: true };
  }
}

export const viewerReportWorkspaceService = new ViewerReportWorkspaceService();
