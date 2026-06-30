import { viewerHangingProtocolService } from './services/viewerHangingProtocolService';
import { getMiniPacsViewportState } from './services/viewportStateAdapter';

const commandsModule = ({ servicesManager, commandsManager, extensionManager }) => {
  return {
    definitions: {
      applyLayoutPreset: {
        commandFn: ({ presetId }) => {
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
    },
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
