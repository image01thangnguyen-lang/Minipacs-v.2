import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';
import { getMiniPacsViewportState } from './viewportStateAdapter';
import { ServicesManager } from '@ohif/core';

export type ViewerViewportMetadata = {
  studyInstanceUid: string;
  seriesInstanceUid?: string;
  sopInstanceUid?: string;
  frameNumber?: number;
  displaySetInstanceUID?: string;
  viewportId: string;
  imageIndex?: number;
  imageCount?: number;
  windowWidth?: number;
  windowCenter?: number;
  zoom?: number;
  pan?: { x: number; y: number };
  modality?: string;
  bodyPartExamined?: string;
  seriesDescription?: string;
  createdFrom: 'viewer-minipacs';
  note?: string;
};

class ViewerKeyImageService {
  async saveKeyImage(viewportId: string, servicesManager: ServicesManager, note?: string): Promise<boolean> {
    const state = getMiniPacsViewportState(viewportId, servicesManager);
    
    if (!state.StudyInstanceUID) {
      commandFeedbackService.show('Không thể lưu Key Image: Không tìm thấy Study UID', 'error');
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
      note,
    };

    const result = await viewerApiClient.post(`/api/viewer/studies/${state.StudyInstanceUID}/key-images`, metadata);
    
    if (result.ok) {
      commandFeedbackService.show('Lưu Key Image thành công (Mock Backend)!', 'info');
      return true;
    } else {
      commandFeedbackService.show(`Lưu thất bại: ${result.message}`, 'warning');
      return false;
    }
  }
}

export const viewerKeyImageService = new ViewerKeyImageService();
