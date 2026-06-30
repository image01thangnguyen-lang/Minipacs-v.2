import { seriesClassificationAdapter, NormalizedSeries } from './seriesClassificationAdapter';
import { layoutPresetService, LayoutPreset } from './layoutPresetService';
import { viewerMprWorkflowService } from './viewerMprWorkflowService';

export type HangingProtocolSuggestion = {
  protocolId: string;
  label: string;
  reason: string;
  layout: { rows: number; cols: number };
  assignments: Array<{
    viewportIndex: number;
    displaySetInstanceUID: string;
    seriesInstanceUid?: string;
    reason?: string;
  }>;
};

class ViewerHangingProtocolService {
  private servicesManager: any;
  private commandsManager: any;
  private extensionManager: any;
  private userHasManualLayoutOverride = false;
  private currentStudyInstanceUid: string | null = null;
  private retryTimeout: any = null;

  public initialize(servicesManager: any, commandsManager: any, extensionManager: any) {
    this.servicesManager = servicesManager;
    this.commandsManager = commandsManager;
    this.extensionManager = extensionManager;
  }

  public setUserHasManualLayoutOverride(override: boolean) {
    this.userHasManualLayoutOverride = override;
  }

  public hasManualOverride() {
    return this.userHasManualLayoutOverride;
  }

  public suggestForStudy(studyInstanceUid: string, displaySets: any[]): HangingProtocolSuggestion | null {
    if (!displaySets || displaySets.length === 0) {
      return null;
    }

    const normalizedSets = displaySets.map(ds => seriesClassificationAdapter.normalizeDisplaySet(ds));
    const mainModality = this.getMainModality(normalizedSets);

    const presetId = layoutPresetService.getLastUsedPreset(mainModality) || 'auto';
    
    if (presetId !== 'auto') {
      const presets = [...layoutPresetService.getBuiltInPresets(), ...layoutPresetService.getSavedPresets()];
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        return this.createSuggestionFromPreset(preset, normalizedSets, mainModality);
      }
    }

    // Auto logic
    let layout = { rows: 1, cols: 1 };
    let assignments: any[] = [];

    const sortedSets = seriesClassificationAdapter.sortSeriesForModality(normalizedSets, mainModality);

    if (mainModality === 'CR' || mainModality === 'DX' || mainModality === 'XR') {
      layout = { rows: 1, cols: 1 };
      if (sortedSets.length > 0) {
        assignments.push({
          viewportIndex: 0,
          displaySetInstanceUID: sortedSets[0].displaySetInstanceUID,
          reason: 'Primary XR series',
        });
      }
    } else if (mainModality === 'CT') {
      const nonLocalizers = sortedSets.filter(s => s.seriesClass !== 'ct_localizer');
      const usableSets = nonLocalizers.length > 0 ? nonLocalizers : sortedSets;

      if (usableSets.length === 1) {
        layout = { rows: 1, cols: 1 };
      } else if (usableSets.length === 2) {
        layout = { rows: 1, cols: 2 };
      } else if (usableSets.length >= 3) {
        layout = { rows: 2, cols: 2 };
      }

      const axial = usableSets.find(s => s.seriesClass === 'ct_axial');
      const coronal = usableSets.find(s => s.seriesClass === 'ct_coronal');
      const sagittal = usableSets.find(s => s.seriesClass === 'ct_sagittal');

      let currentSlot = 0;
      const assign = (ds: NormalizedSeries | undefined) => {
        if (ds && currentSlot < layout.rows * layout.cols) {
          assignments.push({
            viewportIndex: currentSlot,
            displaySetInstanceUID: ds.displaySetInstanceUID,
          });
          currentSlot++;
        }
      };

      assign(axial);
      assign(coronal);
      assign(sagittal);

      for (const ds of usableSets) {
        if (!assignments.find(a => a.displaySetInstanceUID === ds.displaySetInstanceUID) && currentSlot < layout.rows * layout.cols) {
          assign(ds);
        }
      }
    } else if (mainModality === 'MR') {
      layout = sortedSets.length >= 3 ? { rows: 2, cols: 2 } : (sortedSets.length === 2 ? { rows: 1, cols: 2 } : { rows: 1, cols: 1 });
      let currentSlot = 0;
      const assign = (ds: NormalizedSeries | undefined) => {
        if (ds && currentSlot < layout.rows * layout.cols) {
          assignments.push({
            viewportIndex: currentSlot,
            displaySetInstanceUID: ds.displaySetInstanceUID,
          });
          currentSlot++;
        }
      };

      assign(sortedSets.find(s => s.seriesClass === 'mr_t1'));
      assign(sortedSets.find(s => s.seriesClass === 'mr_t2'));
      assign(sortedSets.find(s => s.seriesClass === 'mr_flair'));
      assign(sortedSets.find(s => s.seriesClass === 'mr_dwi'));

      for (const ds of sortedSets) {
        if (!assignments.find(a => a.displaySetInstanceUID === ds.displaySetInstanceUID) && currentSlot < layout.rows * layout.cols) {
          assign(ds);
        }
      }
    } else if (mainModality === 'US') {
      const cines = sortedSets.filter(s => s.seriesClass === 'us_cine');
      const stills = sortedSets.filter(s => s.seriesClass === 'us_still');
      
      if (cines.length > 0 && stills.length > 0) {
        layout = { rows: 1, cols: 2 };
        assignments.push({ viewportIndex: 0, displaySetInstanceUID: cines[0].displaySetInstanceUID });
        assignments.push({ viewportIndex: 1, displaySetInstanceUID: stills[0].displaySetInstanceUID });
      } else if (cines.length > 1) {
        layout = { rows: 1, cols: 2 };
        assignments.push({ viewportIndex: 0, displaySetInstanceUID: cines[0].displaySetInstanceUID });
        assignments.push({ viewportIndex: 1, displaySetInstanceUID: cines[1].displaySetInstanceUID });
      } else {
        layout = { rows: 1, cols: 1 };
        if (sortedSets.length > 0) {
           assignments.push({ viewportIndex: 0, displaySetInstanceUID: sortedSets[0].displaySetInstanceUID });
        }
      }
    } else {
      layout = { rows: 1, cols: 1 };
      if (sortedSets.length > 0) {
        assignments.push({ viewportIndex: 0, displaySetInstanceUID: sortedSets[0].displaySetInstanceUID });
      }
    }

    return {
      protocolId: 'auto',
      label: 'Auto',
      reason: 'Auto suggested layout',
      layout,
      assignments,
    };
  }

  private createSuggestionFromPreset(preset: LayoutPreset, normalizedSets: NormalizedSeries[], mainModality: string): HangingProtocolSuggestion {
    const layout = preset.layout;
    const assignments: any[] = [];
    const sortedSets = seriesClassificationAdapter.sortSeriesForModality(normalizedSets, mainModality);
    const numSlots = layout.rows * layout.cols;
    
    for (let i = 0; i < Math.min(sortedSets.length, numSlots); i++) {
      assignments.push({
        viewportIndex: i,
        displaySetInstanceUID: sortedSets[i].displaySetInstanceUID,
      });
    }

    return {
      protocolId: preset.id,
      label: preset.name,
      reason: 'User preset',
      layout,
      assignments,
    };
  }

  private getMainModality(normalizedSets: NormalizedSeries[]): string {
    const counts: Record<string, number> = {};
    for (const set of normalizedSets) {
      if (set.Modality) {
        counts[set.Modality] = (counts[set.Modality] || 0) + 1;
      }
    }
    let maxModality = 'UNKNOWN';
    let maxCount = 0;
    for (const mod in counts) {
      if (counts[mod] > maxCount) {
        maxCount = counts[mod];
        maxModality = mod;
      }
    }
    return maxModality;
  }

  public async applySuggestion(suggestion: HangingProtocolSuggestion): Promise<boolean> {
    if (!this.servicesManager || !this.commandsManager) {
      console.warn('viewerHangingProtocolService not initialized');
      return false;
    }

    const { viewportGridService } = this.servicesManager.services;

    try {
      // Set grid layout
      this.commandsManager.runCommand('setViewportGridLayout', {
        numRows: suggestion.layout.rows,
        numCols: suggestion.layout.cols,
      });

      // OHIF apply layout async, wait for state to reflect
      await new Promise<void>((resolve) => {
        const { unsubscribe } = viewportGridService.subscribe(
          viewportGridService.EVENTS.LAYOUT_CHANGED,
          () => {
            unsubscribe();
            resolve();
          }
        );

        // Fallback in case layout is already correct and event doesn't fire
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 300);
      });

      const viewportState = viewportGridService.getState();
      const viewportIds = Array.from(viewportState.viewports.keys()) as string[];

      // Prepare assignments
      const viewportsToUpdate = [];
      for (const a of suggestion.assignments) {
        const viewportId = viewportIds[a.viewportIndex];
        if (!viewportId) {
          console.warn(`Missing viewportId for index ${a.viewportIndex}`);
          const { uiNotificationService } = this.servicesManager.services;
          if (uiNotificationService) {
             uiNotificationService.show({
               title: 'Layout Error',
               message: `Could not assign series to viewport slot ${a.viewportIndex + 1}.`,
               type: 'error'
             });
          }
          return false;
        }
        viewportsToUpdate.push({
          viewportId,
          displaySetInstanceUIDs: [a.displaySetInstanceUID],
          viewportOptions: {},
          displaySetOptions: [{}],
        });
      }

      // In OHIF, setDisplaySetsForViewports takes an array of { viewportId, displaySetInstanceUIDs, ... }
      viewportGridService.setDisplaySetsForViewports(viewportsToUpdate);

      // Audit log
      this.audit('hanging_protocol_applied', {
        protocolId: suggestion.protocolId,
        layout: suggestion.layout,
        assignments: suggestion.assignments.map(a => a.displaySetInstanceUID),
      }, this.currentStudyInstanceUid);

      return true;
    } catch (error) {
      console.error('Failed to apply hanging protocol suggestion', error);
      return false;
    }
  }

  public async applyPreset(presetId: string, studyInstanceUid: string): Promise<boolean> {
    const { displaySetService } = this.servicesManager.services;
    const displaySets = displaySetService.getActiveDisplaySets().filter((ds: any) => ds.StudyInstanceUID === studyInstanceUid);
    
    const normalizedSets = displaySets.map((ds: any) => seriesClassificationAdapter.normalizeDisplaySet(ds));
    const mainModality = this.getMainModality(normalizedSets);

    layoutPresetService.setLastUsedPreset(mainModality, presetId);
    
    if (presetId === 'auto') {
      const suggestion = this.suggestForStudy(studyInstanceUid, displaySets);
      if (suggestion) {
        return this.applySuggestion(suggestion);
      }
    } else {
      const presets = [...layoutPresetService.getBuiltInPresets(), ...layoutPresetService.getSavedPresets()];
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        const suggestion = this.createSuggestionFromPreset(preset, normalizedSets, mainModality);
        return this.applySuggestion(suggestion);
      }
    }
    return false;
  }

  public runAutoLayoutWhenReady(studyInstanceUid: string, maxRetries = 5, retryDelay = 1000) {
    if (this.userHasManualLayoutOverride) {
      return; // Do not auto layout if user has overridden
    }

    this.currentStudyInstanceUid = studyInstanceUid;
    const { displaySetService } = this.servicesManager.services;

    const tryLayout = (retriesLeft: number) => {
      // If study changed while waiting, abort
      if (this.currentStudyInstanceUid !== studyInstanceUid) return;
      if (this.userHasManualLayoutOverride) return;
      if (viewerMprWorkflowService.isInMpr()) return;

      const displaySets = displaySetService.getActiveDisplaySets().filter((ds: any) => ds.StudyInstanceUID === studyInstanceUid);
      
      // Wait until we have at least one reconstructable/image displaySet
      const hasImages = displaySets.some((ds: any) => ds.Modality && ds.instances && ds.instances.length > 0);

      if (!hasImages && retriesLeft > 0) {
        this.retryTimeout = setTimeout(() => tryLayout(retriesLeft - 1), retryDelay);
        return;
      }

      if (hasImages) {
        const suggestion = this.suggestForStudy(studyInstanceUid, displaySets);
        if (suggestion) {
          this.audit('hanging_protocol_suggested', {
            protocolId: suggestion.protocolId,
          }, studyInstanceUid);
          this.applySuggestion(suggestion);
        }
      }
    };

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    tryLayout(maxRetries);
  }

  private audit(action: string, details: any, studyInstanceUid: string | null = null) {
    try {
      const uid = studyInstanceUid || this.currentStudyInstanceUid;
      if (!uid) return;
      
      fetch('/api/audit/viewer-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyInstanceUid: uid,
          action,
          metadata: details,
        }),
      }).catch(() => {});
    } catch (e) {
      // Ignore
    }
  }
}

export const viewerHangingProtocolService = new ViewerHangingProtocolService();
