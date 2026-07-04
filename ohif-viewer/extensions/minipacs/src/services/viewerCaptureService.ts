import { viewerApiClient } from './viewerApiClient';
import { getMiniPacsViewportState } from './viewportStateAdapter';
import { viewerSnapshotService } from './viewerSnapshotService';

export const viewerCaptureService = {
  saveFullviewSnapshot: async (servicesManager: any) => {
    // Basic canvas capture mock implementation for Phase 4 MVP
    try {
      const activeViewportId = servicesManager.services.viewportGridService.getActiveViewportId();
      const state = getMiniPacsViewportState(activeViewportId, servicesManager);
      if (!state || !state.StudyInstanceUID) {
        console.warn('No active viewport state for capture');
        return;
      }
      
      // In a real implementation, we would get the canvas from cornerstone
      const dataUrl = 'data:image/jpeg;base64,mock...'; 
      const metadata = {
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
        createdFrom: 'viewer-minipacs-capture',
        imageUrl: dataUrl,
        category: 'SERVER',
        isFullViewport: true,
      };

      const result = await viewerApiClient.post('/api/viewer/snapshots', metadata);
      if (result.ok) {
         console.log('Snapshot captured');
      }

    } catch (e) {
      console.error('Failed to capture fullview', e);
    }
  },
  
  startCropCapture: async (servicesManager: any) => {
    // Basic crop mock
    console.log('startCropCapture triggered');
  }
};
