export type MiniPacsToolStatus =
  | 'ready'
  | 'ui-state'
  | 'ohif-service'
  | 'backend'
  | 'advanced'
  | 'guarded';

export type MiniPacsToolPlacement =
  | 'top-toolbar'
  | 'left-panel'
  | 'viewport-toolbar'
  | 'series-menu';

export type MiniPacsTool = {
  id: string;
  label: string;
  type: 'tool' | 'action' | 'toggle';
  commandName?: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
  status: MiniPacsToolStatus;
  placement: MiniPacsToolPlacement[];
  icon?: string; // Optional icon identifier mapped in the UI component
  section?: string;
  kind?: string;
  hotkey?: string;
  requires?: string[];
  destructive?: boolean;
};

export type MiniPacsToolSection = {
  id: string;
  title: string;
  placement: MiniPacsToolPlacement;
  renderType: 'icons' | 'list' | 'grid';
  defaultOpen?: boolean;
  toolIds: string[]; // References to MiniPacsTool.id
};

import { windowLevelPresets } from './windowLevelPresets';
import { viewportWorkflowActions } from './viewportWorkflowActions';

export const minipacsToolRegistry: MiniPacsTool[] = [
  // --- Top Toolbar Tools (Ready) ---
  { id: 'Cursor', label: 'Cursor', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Pan', label: 'Pan', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'WindowLevel', label: 'W/L Manual', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Zoom', label: 'Zoom', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'StackScroll', label: 'Stack Scroll', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Length', label: 'Length', type: 'tool', status: 'ready', placement: ['top-toolbar', 'left-panel'] },
  { id: 'Angle', label: 'Angle', type: 'tool', status: 'ready', placement: ['top-toolbar', 'left-panel'] },
  { id: 'Probe', label: 'Probe', type: 'tool', commandOptions: { toolName: 'DragProbe' }, status: 'ready', placement: ['top-toolbar'] },
  { id: 'Crosshairs', label: 'Crosshairs', type: 'tool', commandOptions: { toolName: 'Crosshairs', toolGroupId: 'mpr' }, status: 'ready', placement: ['top-toolbar', 'left-panel'] },
  { id: 'Reset', label: 'Reset', type: 'action', commandName: 'resetViewport', status: 'ready', placement: ['top-toolbar'] },

  // --- Measurement Tools ---
  { id: 'Bidirectional', label: 'Bidirectional', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'EllipticalROI', label: 'Ellipse', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CircleROI', label: 'Circle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'RectangleROI', label: 'Rectangle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CalibrationLine', label: 'Calibration', type: 'tool', status: 'ready', placement: ['left-panel'] },
  // Advanced Measurements
  { id: 'DoubleLength', label: 'Double Length', type: 'tool', status: 'advanced', placement: ['left-panel'] },
  { id: 'NASCET', label: 'NASCET/ESCT', type: 'tool', status: 'advanced', placement: ['left-panel'] },
  { id: 'Volume', label: 'Volume', type: 'tool', status: 'advanced', placement: ['left-panel'] },

  // --- Annotation Tools ---
  { id: 'ArrowAnnotate', label: 'Arrow', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'PlanarFreehandROI', label: 'Freehand', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'TextAnnotation', label: 'Text Annotation', type: 'tool', status: 'advanced', placement: ['left-panel'] },
  { id: 'AILabeling', label: 'AI Labeling', type: 'action', status: 'advanced', placement: ['left-panel'] },

  // --- Image Manipulation Tools ---
  { id: 'RotateRight', label: 'Rotate +90', type: 'action', commandName: 'rotateViewportCW', status: 'ready', placement: ['left-panel'] },
  { id: 'FlipHorizontal', label: 'Flip H', type: 'action', commandName: 'flipViewportHorizontal', status: 'ready', placement: ['left-panel'] },
  { id: 'FlipVertical', label: 'Flip V', type: 'action', commandName: 'flipViewportVertical', status: 'ready', placement: ['left-panel'] },
  { id: 'Invert', label: 'Invert', type: 'action', commandName: 'invertViewport', status: 'ready', placement: ['left-panel'] },
  { id: 'Magnify', label: 'Magnify', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'Cine', label: 'Cine', type: 'toggle', commandName: 'toggleCine', status: 'ready', placement: ['left-panel'] },

  // --- MPR & Sync Tools ---
  { id: 'MPR', label: 'MPR', type: 'action', commandName: 'toggleHangingProtocol', commandOptions: { protocolId: 'mpr' }, context: 'DEFAULT', status: 'ohif-service', placement: ['left-panel'] },
  { id: 'ReferenceLines', label: 'Ref Lines', type: 'toggle', commandName: 'setToolActive', commandOptions: { toolName: 'ReferenceLines' }, status: 'ready', placement: ['left-panel'] },
  { id: 'StackImageSync', label: 'Stack Sync', type: 'toggle', commandName: 'toggleStackImageSync', status: 'ohif-service', placement: ['left-panel'] },
  { id: 'FusionMPR', label: 'Fusion on MPR', type: 'action', status: 'advanced', placement: ['left-panel'] },

  // --- Capture & Info Tools ---
  { id: 'Capture', label: 'Capture (Local)', type: 'action', commandName: 'showDownloadViewportModal', status: 'ready', placement: ['left-panel'] },
  { id: 'SaveSnapshot', label: 'Save Snapshot', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Gallery', label: 'Gallery', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'TagBrowser', label: 'DICOM Tags', type: 'action', commandName: 'openDICOMTagViewer', context: 'DEFAULT', status: 'ready', placement: ['left-panel'] },

  // --- Layout Tools ---
  { id: '1x1', label: '1x1', type: 'action', status: 'ohif-service', placement: ['left-panel'] },
  { id: '1x2', label: '1x2', type: 'action', status: 'ohif-service', placement: ['left-panel'] },
  { id: '2x1', label: '2x1', type: 'action', status: 'ohif-service', placement: ['left-panel'] },
  { id: '2x2', label: '2x2', type: 'action', status: 'ohif-service', placement: ['left-panel'] },
  { id: '3x3', label: '3x3', type: 'action', status: 'ohif-service', placement: ['left-panel'] },

  // --- Series Menu (Overflow) ---
  { id: 'DeleteSeries', label: 'Delete Series', type: 'action', status: 'guarded', placement: ['series-menu'], destructive: true },
  { id: 'ExportVideo', label: 'Export Video', type: 'action', status: 'backend', placement: ['series-menu'] },

  // --- History & More Tools ---
  { id: 'StudyHistory', label: 'History', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Report', label: 'Report', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'PACSConfig', label: 'PACS Config', type: 'action', status: 'guarded', placement: ['left-panel'] },
  { id: 'UserConfig', label: 'User Config', type: 'action', status: 'guarded', placement: ['left-panel'] },
  { id: 'About', label: 'About', type: 'action', status: 'ready', placement: ['left-panel'] },

  // --- Viewport Workflow Actions ---
  ...viewportWorkflowActions,

  // --- Window/Level Presets ---
  ...windowLevelPresets.map(preset => ({
    id: preset.id,
    label: preset.label,
    type: 'action' as const,
    commandName: preset.id === 'Default' ? 'resetViewport' : 'setWindowLevel',
    commandOptions: preset.id === 'Default' ? {} : { window: preset.window, level: preset.level },
    status: 'ready' as const,
    placement: ['left-panel'] as MiniPacsToolPlacement[],
    hotkey: preset.hotkey,
  })),
];

export const minipacsToolSections: MiniPacsToolSection[] = [
  {
    id: 'history',
    title: 'History',
    placement: 'left-panel',
    renderType: 'list',
    defaultOpen: true,
    toolIds: ['StudyHistory'],
  },
  {
    id: 'layout',
    title: 'Layout',
    placement: 'left-panel',
    renderType: 'grid',
    defaultOpen: true,
    toolIds: ['1x1', '1x2', '2x1', '2x2', '3x3'],
  },
  {
    id: 'measurement',
    title: 'Measurement Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Length', 'Angle', 'Bidirectional', 'EllipticalROI', 'CircleROI', 'RectangleROI', 'CalibrationLine'],
  },
  {
    id: 'advanced-tools',
    title: 'Advance Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['DoubleLength', 'NASCET', 'Volume'],
  },
  {
    id: 'capture-tools',
    title: 'Image Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['RotateRight', 'FlipHorizontal', 'FlipVertical', 'Invert', 'Capture', 'SaveSnapshot'],
  },
  {
    id: 'imagetools',
    title: 'Image Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['RotateRight', 'FlipHorizontal', 'FlipVertical', 'Invert', 'Magnify', 'Cine'],
  },
  {
    id: 'sync-tools',
    title: 'Sync Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['ReferenceLines', 'StackImageSync'],
  },
  {
    id: 'mpr-tools',
    title: 'MPR Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['MPR', 'FusionMPR'],
  },
  {
    id: 'annotation',
    title: 'Annotation Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['ArrowAnnotate', 'PlanarFreehandROI', 'TextAnnotation', 'AILabeling'],
  },
  {
    id: 'capture-info',
    title: 'Capture Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Capture', 'Gallery'],
  },
  {
    id: 'more-tools',
    title: 'More Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Report', 'TagBrowser', 'PACSConfig', 'UserConfig', 'About'],
  },
];
