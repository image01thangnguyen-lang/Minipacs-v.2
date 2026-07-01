import { viewerHangingProtocolService } from './services/viewerHangingProtocolService';
import { getMiniPacsViewportState } from './services/viewportStateAdapter';
import { viewerMprWorkflowService } from './services/viewerMprWorkflowService';

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
        commandFn: async ({ toggledState }) => {
          const isTurnOn = toggledState !== false;
          await viewerMprWorkflowService.setCrosshairsEnabled(isTurnOn);
        },
        storeContexts: [],
        options: {},
      },
    },
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
