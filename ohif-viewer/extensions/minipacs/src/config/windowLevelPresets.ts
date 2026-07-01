export type WindowLevelPreset = {
  id: string;
  label: string;
  window: number;
  level: number;
  hotkey?: string;
};

export const windowLevelPresets: WindowLevelPreset[] = [
  { id: 'Default', label: 'Default', window: 0, level: 0 },
  { id: 'Brain', label: 'Brain F1 (80/40)', window: 80, level: 40, hotkey: '1' },
  { id: 'Subdural', label: 'Subdural F2 (250/50)', window: 250, level: 50, hotkey: 'F2' },
  { id: 'Stroke', label: 'Stroke F3 (40/40)', window: 40, level: 40, hotkey: 'F3' },
  { id: 'Temporal', label: 'Temporal bones F4 (4000/400)', window: 4000, level: 400, hotkey: 'F4' },
  { id: 'SoftTissue', label: 'Soft tissues F6 (400/40)', window: 400, level: 40, hotkey: 'F6' },
  { id: 'Lung', label: 'Lung F7 (1200/-600)', window: 1200, level: -600, hotkey: 'F7' },
  { id: 'Mediastinum', label: 'Mediastinum F8 (400/40)', window: 400, level: 40, hotkey: 'F8' },
  { id: 'AbdomenSoft', label: 'Abdomen soft tissues F9 (400/40)', window: 400, level: 40, hotkey: 'F9' },
  { id: 'Liver', label: 'Liver F10 (150/90)', window: 150, level: 90, hotkey: 'F10' },
  { id: 'SpineSoft', label: 'Spine soft tissues (400/40)', window: 400, level: 40 },
  { id: 'SpineBone', label: 'Spine bone (2500/480)', window: 2500, level: 480 },
];
