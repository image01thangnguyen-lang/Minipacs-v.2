export type LayoutPreset = {
  id: string;
  name: string;
  layout: { rows: number; cols: number };
};

const PRESETS_KEY = 'minipacs.viewer.layoutPresets.v1';
const LAST_USED_KEY = 'minipacs.viewer.lastLayoutByModality.v1';

export const layoutPresetService = {
  getBuiltInPresets(): LayoutPreset[] {
    return [
      { id: 'auto', name: 'Auto', layout: { rows: 0, cols: 0 } }, // Auto uses dynamic rows/cols
      { id: 'xr_1x1', name: 'XR 1x1', layout: { rows: 1, cols: 1 } },
      { id: 'ct_2x2', name: 'CT 2x2', layout: { rows: 2, cols: 2 } },
      { id: 'mr_2x2', name: 'MR 2x2', layout: { rows: 2, cols: 2 } },
      { id: 'us_cine', name: 'US Cine', layout: { rows: 1, cols: 1 } },
    ];
  },

  getSavedPresets(): LayoutPreset[] {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load layout presets from localStorage', e);
    }
    return [];
  },

  savePreset(preset: LayoutPreset) {
    try {
      const presets = this.getSavedPresets();
      const existingIdx = presets.findIndex(p => p.id === preset.id);
      if (existingIdx >= 0) {
        presets[existingIdx] = preset;
      } else {
        presets.push(preset);
      }
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save layout preset to localStorage', e);
    }
  },

  getLastUsedPreset(modality: string): string | null {
    try {
      const stored = localStorage.getItem(LAST_USED_KEY);
      if (stored) {
        const map = JSON.parse(stored);
        return map[modality] || null;
      }
    } catch (e) {
      console.warn('Failed to get last used preset', e);
    }
    return null;
  },

  setLastUsedPreset(modality: string, presetId: string) {
    try {
      let map: any = {};
      const stored = localStorage.getItem(LAST_USED_KEY);
      if (stored) {
        map = JSON.parse(stored);
      }
      map[modality] = presetId;
      localStorage.setItem(LAST_USED_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to set last used preset', e);
    }
  },
};
