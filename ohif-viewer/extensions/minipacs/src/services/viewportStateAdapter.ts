import { ServicesManager } from '@ohif/core';
import { mapDisplaySetsToMiniPacsSeries } from './seriesAdapter';
export type MiniPacsViewportState = {
  viewportId: string;
  isActive: boolean;
  displaySetInstanceUID?: string;
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  SOPInstanceUID?: string;
  frameNumber?: number;
  Modality?: string;
  SeriesNumber?: number | string;
  SeriesDescription?: string;
  BodyPartExamined?: string;
  StudyDate?: string;
  StudyTime?: string;
  imageIndex?: number;
  imageCount?: number;
  instanceNumber?: number | string;
  windowWidth?: number;
  windowCenter?: number;
  zoom?: number;
  isCineEnabled?: boolean;
  isCinePlaying?: boolean;
  seriesIndex?: number; // Order of this series in the study
  isMultiFrame?: boolean;
  isStack?: boolean;
  canCine?: boolean;
};

export function getMiniPacsViewportState(
  viewportId: string,
  servicesManager: ServicesManager
): MiniPacsViewportState {
  const {
    viewportGridService,
    displaySetService,
    cornerstoneViewportService,
    cineService,
  } = servicesManager.services;

  const defaultState: MiniPacsViewportState = {
    viewportId,
    isActive: false,
  };

  try {
    // 1. Grid State (Is Active?)
    const gridState = viewportGridService.getState();
    defaultState.isActive = gridState.activeViewportId === viewportId;

    // Viewport configuration from grid
    const viewportInfo = gridState.viewports.get(viewportId);
    if (!viewportInfo) {
      return defaultState;
    }

    const displaySetInstanceUIDs = viewportInfo.displaySetInstanceUIDs;
    if (!displaySetInstanceUIDs || displaySetInstanceUIDs.length === 0) {
      return defaultState;
    }

    const displaySetInstanceUID = displaySetInstanceUIDs[0];
    defaultState.displaySetInstanceUID = displaySetInstanceUID;

    // 2. DisplaySet Metadata
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
    if (displaySet) {
      defaultState.StudyInstanceUID = displaySet.StudyInstanceUID;
      defaultState.SeriesInstanceUID = displaySet.SeriesInstanceUID;
      defaultState.Modality = displaySet.Modality;
      defaultState.SeriesNumber = displaySet.SeriesNumber;
      defaultState.SeriesDescription = displaySet.SeriesDescription;
      defaultState.imageCount = displaySet.numImageFrames || displaySet.images?.length || 0;
      
      // Get first instance for study/body part data
      const instance = displaySet.images?.[0] || displaySet.instance;
      if (instance) {
        defaultState.BodyPartExamined = instance.BodyPartExamined;
        defaultState.StudyDate = instance.StudyDate;
        defaultState.StudyTime = instance.StudyTime;
      }

      // Calculate series index (order in display sets)
      const allDisplaySets = displaySetService.activeDisplaySets || [];
      const mappedSeries = mapDisplaySetsToMiniPacsSeries(allDisplaySets, {});
      const seriesIndex = mappedSeries.findIndex(ds => ds.displaySetInstanceUID === displaySetInstanceUID);
      if (seriesIndex !== -1) {
        defaultState.seriesIndex = seriesIndex + 1;
      }
    }

    // 3. Runtime Viewport Data (Cornerstone specific)
    if (cornerstoneViewportService) {
      const csViewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
      if (csViewportInfo) {
        const viewportData = csViewportInfo.getViewportData();
        const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        
        if (csViewport) {
          // Zoom
          const camera = csViewport.getCamera();
          if (camera && camera.scale) {
            defaultState.zoom = camera.scale;
          }

          // Window/Level
          const properties = csViewport.getProperties();
          if (properties && properties.voiRange) {
            const { lower, upper } = properties.voiRange;
            const windowWidth = upper - lower;
            const windowCenter = lower + windowWidth / 2;
            defaultState.windowWidth = windowWidth;
            defaultState.windowCenter = windowCenter;
          }
        }
      }
    }

    // 4. Cine / Stack State
    const numFrames = displaySet?.numImageFrames || 1;
    const numImages = displaySet?.images?.length || 1;
    
    defaultState.isMultiFrame = numFrames > 1;
    defaultState.isStack = numImages > 1;
    defaultState.canCine = defaultState.isMultiFrame || defaultState.isStack;
    defaultState.imageCount = Math.max(numFrames, numImages);

    if (cornerstoneViewportService) {
      const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (csViewport && typeof csViewport.getCurrentImageIdIndex === 'function') {
        const idx = csViewport.getCurrentImageIdIndex();
        defaultState.imageIndex = idx + 1;
        
        // Extract SOPInstanceUID and frameNumber for the active image
        const instance = displaySet?.images?.[idx] || displaySet?.instances?.[idx] || displaySet?.instance;
        if (instance) {
          defaultState.SOPInstanceUID = instance.SOPInstanceUID;
          // For multi-frame, instance might be the same but frameNumber differs. 
          // If the metadata has frameNumber we use it, otherwise we fallback to the index + 1
          defaultState.frameNumber = instance.frameNumber || (idx + 1);
        }
      }
    }

    if (cineService) {
      const cineState = cineService.getState();
      defaultState.isCineEnabled = defaultState.canCine;
      defaultState.isCinePlaying = cineState.cines?.[viewportId]?.isPlaying || false;
    }

  } catch (error) {
    console.warn('Error resolving MiniPACS viewport state for', viewportId, error);
  }

  return defaultState;
}
