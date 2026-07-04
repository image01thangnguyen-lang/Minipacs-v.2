import { viewerHangingProtocolService } from './services/viewerHangingProtocolService';
import { getMiniPacsViewportState } from './services/viewportStateAdapter';
import { viewerMprWorkflowService } from './services/viewerMprWorkflowService';
import { viewerCaptureService } from './services/viewerCaptureService';
import React from 'react';
import MiniPacsViewerConfigDialog from './Components/MiniPacsViewerConfigDialog';
import MiniPacsActionHistoryPanel from './Components/MiniPacsActionHistoryPanel';
import MiniPacsDownloadManager from './Components/MiniPacsDownloadManager';

const commandsModule = ({ servicesManager, commandsManager, extensionManager }) => {
  viewerMprWorkflowService.initialize(servicesManager, commandsManager);

  return {
    definitions: {
      applyLayoutPreset: {
        commandFn: async ({ presetId }) => {
          if (viewerMprWorkflowService.isInMpr()) {
            await viewerMprWorkflowService.exitCurrentMprProtocol();
            await new Promise(r => setTimeout(r, 200));
          }

          const state = getMiniPacsViewportState(
            servicesManager.services.viewportGridService.getActiveViewportId(),
            servicesManager
          );
          if (state && state.StudyInstanceUID) {
            if (presetId === 'auto') {
              viewerHangingProtocolService.setUserHasManualLayoutOverride(false);
            } else {
              viewerHangingProtocolService.setUserHasManualLayoutOverride(true);
            }
            viewerHangingProtocolService.applyPreset(presetId, state.StudyInstanceUID);
          }
        },
        storeContexts: [],
        options: { presetId: 'auto' },
      },
      toggleMiniPacsMpr: {
        commandFn: async () => {
          viewerHangingProtocolService.setUserHasManualLayoutOverride(true);
          await viewerMprWorkflowService.toggleMpr();
        },
        storeContexts: [],
        options: {},
      },
      toggleMiniPacsMipVolume: {
        commandFn: async () => {
          viewerHangingProtocolService.setUserHasManualLayoutOverride(true);
          await viewerMprWorkflowService.toggleMipVolume();
        },
        storeContexts: [],
        options: {},
      },
      toggleMiniPacsCrosshairs: {
        commandFn: ({ toggledState }) => {
          const isTurnOn = toggledState !== false;
          viewerMprWorkflowService.setCrosshairsEnabled(isTurnOn);
        },
        storeContexts: [],
        options: {},
      },
      openViewerConfig: {
        commandFn: ({ servicesManager }) => {
          const { uiDialogService } = servicesManager.services;
          uiDialogService.create({
            id: 'viewer-config-dialog',
            centralize: true,
            isDraggable: true,
            showOverlay: true,
            content: React.createElement(MiniPacsViewerConfigDialog),
            title: 'Viewer Preferences',
          });
        },
      },
      openActionHistory: {
        commandFn: ({ servicesManager }) => {
          // Open Action History panel
          const { uiDialogService } = servicesManager.services;
          uiDialogService.create({
            id: 'viewer-action-history-dialog',
            centralize: true,
            isDraggable: true,
            showOverlay: true,
            content: React.createElement(MiniPacsActionHistoryPanel, {
              studyInstanceUid: getMiniPacsViewportState(
                servicesManager.services.viewportGridService.getActiveViewportId(),
                servicesManager
              )?.StudyInstanceUID
            }),
            title: 'Action History',
          });
        },
      },
      saveFullviewSnapshot: {
        commandFn: ({ servicesManager }) => {
          viewerCaptureService.saveFullviewSnapshot(servicesManager);
        },
      },
      startCropCapture: {
        commandFn: ({ servicesManager }) => {
          viewerCaptureService.startCropCapture(servicesManager);
        },
      },
      openDownloadManager: {
        commandFn: ({ servicesManager }) => {
          const { uiDialogService } = servicesManager.services;
          uiDialogService.create({
            id: 'viewer-download-manager-dialog',
            centralize: true,
            isDraggable: true,
            showOverlay: true,
            content: React.createElement(MiniPacsDownloadManager),
            title: 'Download Manager',
          });
        },
      },
      toggleAnonymizedDisplay: {
        commandFn: ({ toggledState }) => {
          console.log('TODO: Implement toggleAnonymizedDisplay', toggledState);
        },
      },
      toggleDicomOverlayTags: {
        commandFn: ({ toggledState }) => {
          console.log('TODO: Implement toggleDicomOverlayTags', toggledState);
        },
      },
      requestDeleteSeries: {
        commandFn: () => {
          console.log('TODO: Implement requestDeleteSeries guarded UI');
        },
      },
    },
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
