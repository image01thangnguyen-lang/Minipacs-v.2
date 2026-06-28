import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';
import { getMiniPacsViewportState } from './viewportStateAdapter';
import { ServicesManager } from '@ohif/core';
import { ViewerViewportMetadata } from './viewerKeyImageService';

export type SnapshotRecord = ViewerViewportMetadata & {
  id: string;
  createdAt: string;
  previewUrl?: string; // If backend generates thumbnails
};

class ViewerSnapshotService {
  async saveSnapshot(viewportId: string, servicesManager: ServicesManager): Promise<boolean> {
    const state = getMiniPacsViewportState(viewportId, servicesManager);
    
    if (!state.StudyInstanceUID) {
      commandFeedbackService.show('Không thể lưu Snapshot: Không tìm thấy Study UID', 'error');
      return false;
    }

    const metadata: ViewerViewportMetadata = {
      studyInstanceUid: state.StudyInstanceUID,
      seriesInstanceUid: state.SeriesInstanceUID,
      sopInstanceUid: state.SOPInstanceUID,
      frameNumber: state.frameNumber,
      displaySetInstanceUID: state.displaySetInstanceUID,
      viewportId: state.viewportId,
      imageIndex: state.imageIndex,
      imageCount: state.imageCount,
      windowWidth: state.windowWidth,
      windowCenter: state.windowCenter,
      zoom: state.zoom,
      modality: state.Modality,
      bodyPartExamined: state.BodyPartExamined,
      seriesDescription: state.SeriesDescription,
      createdFrom: 'viewer-minipacs',
    };

    const result = await viewerApiClient.post(`/api/viewer/snapshots`, metadata);
    
    if (result.ok) {
      commandFeedbackService.show('Đã lưu Snapshot thành công (Mock Backend)!', 'info');
      return true;
    } else {
      commandFeedbackService.show(`Lưu Snapshot thất bại: ${result.message}`, 'warning');
      return false;
    }
  }

  async getSnapshots(studyInstanceUid: string): Promise<SnapshotRecord[]> {
    const result = await viewerApiClient.get<SnapshotRecord[]>(`/api/viewer/snapshots?studyInstanceUid=${studyInstanceUid}`);
    if (result.ok && result.data) {
      return result.data;
    }
    return [];
  }
}

export const viewerSnapshotService = new ViewerSnapshotService();
