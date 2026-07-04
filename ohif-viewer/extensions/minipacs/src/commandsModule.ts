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
      setMiniPacsMprOrientation: {
        commandFn: ({ orientation, servicesManager }) => {
          // FIXME: This is currently a stub for MPR orientation logic.
          // OHIF orientation API is pending integration. Tool is marked as deferred-advanced in registry.
          const { viewportGridService } = servicesManager.services;
          const viewportId = viewportGridService.getActiveViewportId();
          if (!viewportId) return;
          
          // Use OHIF's built-in setViewportActive or cornerstone command to set orientation
          // For now, we will dispatch setViewportActive or use cornerstone API directly.
          try {
             servicesManager.services.cornerstoneViewportService.setViewportOrientation(viewportId, orientation);
          } catch (e) {
             console.log('Failed to set orientation via cornerstoneViewportService', e);
          }
          
          // Also fetch to audit log
          try {
             fetch('/api/audit/viewer-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                   action: `mpr_orientation_changed_to_${orientation}`,
                   metadata: { viewportId, orientation }
                })
             }).catch(() => {});
          } catch(e) {}
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
      openCTRatioPanel: {
        commandFn: ({ servicesManager }) => {
          const { uiDialogService } = servicesManager.services;
          // Dynamically import or require the component to avoid circular dependencies if any
          // For now, we will create MiniPacsCTRatioPanel.tsx
          import('./Components/MiniPacsCTRatioPanel').then(({ MiniPacsCTRatioPanel }) => {
            uiDialogService.create({
              id: 'viewer-ctratio-panel-dialog',
              centralize: false,
              isDraggable: true,
              showOverlay: false,
              content: React.createElement(MiniPacsCTRatioPanel, { servicesManager }),
              title: 'CT Ratio Measurement',
              defaultPosition: { x: window.innerWidth - 320, y: 100 }
            });
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
