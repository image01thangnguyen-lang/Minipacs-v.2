export type MiniPacsToolStatus =
  | 'ready'
  | 'ui-state'
  | 'ohif-service'
  | 'backend'
  | 'deferred-advanced'
  | 'deferred-native'
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
  { id: 'Crosshairs', label: 'Crosshairs', type: 'toggle', commandName: 'toggleMiniPacsCrosshairs', context: 'DEFAULT', status: 'ready', placement: ['top-toolbar', 'left-panel'] },
  { id: 'Reset', label: 'Reset', type: 'action', commandName: 'resetViewport', status: 'ready', placement: ['top-toolbar'] },

  // --- Measurement Tools ---
  { id: 'Bidirectional', label: 'Bidirectional', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'EllipticalROI', label: 'Ellipse', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CircleROI', label: 'Circle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'RectangleROI', label: 'Rectangle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CalibrationLine', label: 'Calibration', type: 'tool', status: 'ready', placement: ['left-panel'] },
  // Advanced Measurements
  { id: 'DoubleLength', label: 'Double Length', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'NASCET', label: 'NASCET/ESCT', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Volume', label: 'Volume', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },

  // --- Annotation Tools ---
  { id: 'ArrowAnnotate', label: 'Arrow', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'PlanarFreehandROI', label: 'Freehand', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'TextAnnotation', label: 'Text Annotation', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'AILabeling', label: 'AI Labeling', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },

  // --- Image Manipulation Tools ---
  { id: 'RotateLeft', label: 'Rotate -90', type: 'action', commandName: 'rotateViewportCCW', status: 'ready', placement: ['top-toolbar'] },
  { id: 'RotateRight', label: 'Rotate +90', type: 'action', commandName: 'rotateViewportCW', status: 'ready', placement: ['top-toolbar'] },
  { id: 'FlipHorizontal', label: 'Flip H', type: 'action', commandName: 'flipViewportHorizontal', status: 'ready', placement: ['top-toolbar'] },
  { id: 'FlipVertical', label: 'Flip V', type: 'action', commandName: 'flipViewportVertical', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Invert', label: 'Invert', type: 'action', commandName: 'invertViewport', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Magnify', label: 'Magnify', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Cine', label: 'Cine', type: 'toggle', commandName: 'toggleCine', status: 'ready', placement: ['top-toolbar'] },

  // --- MPR & Sync Tools ---
  { id: 'MPR', label: 'MPR', type: 'action', commandName: 'toggleMiniPacsMpr', context: 'DEFAULT', status: 'deferred-advanced', placement: ['top-toolbar'] },
  { id: 'ReferenceLines', label: 'Ref Lines', type: 'toggle', commandName: 'setToolActive', commandOptions: { toolName: 'ReferenceLines' }, status: 'ready', placement: ['left-panel'] },
  { id: 'StackImageSync', label: 'Stack Sync', type: 'toggle', commandName: 'toggleStackImageSync', status: 'ohif-service', placement: ['left-panel'] },
  { id: 'FusionMPR', label: 'Fusion on MPR', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },

  // --- Capture & Info Tools ---
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

  // --- History & More Tools ---
  { id: 'StudyHistory', label: 'History', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Report', label: 'Report', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'ReportWorkspace', label: 'Report Ws', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Diagnostics', label: 'Diagnostics', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'PACSConfig', label: 'PACS Config', type: 'action', status: 'guarded', placement: ['left-panel'] },
  { id: 'UserConfig', label: 'User Config', type: 'action', status: 'guarded', placement: ['left-panel'] },
  { id: 'About', label: 'About', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Print', label: 'Browser Print', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'DirectPrint', label: 'DICOM Print', type: 'action', status: 'deferred-native', placement: ['left-panel'] },
  { id: 'CDBurn', label: 'Burn CD/DVD', type: 'action', status: 'deferred-native', placement: ['left-panel'] },

  // --- Missing 100+ Tools for Phase 1 ---
  { id: 'Caliper', label: 'Caliper', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'AngleVector', label: 'Angle Vector', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'PolygonROI', label: 'Polygon', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'MirrorROI', label: 'Mirror ROI', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'BrainMirror', label: 'Brain Mirror', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'VolumePolygon', label: 'Volume Polygon', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Cardiopulmonary', label: 'Cardiopulmonary', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Mammography', label: 'Mammography', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Reconstruction', label: 'Reconstruction', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'ExportVideo', label: 'Export Video', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'FreeRotate', label: 'Free Rotate', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'AutoSync', label: 'Auto Sync', type: 'toggle', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Crosshair3D', label: 'Crosshair 3D', type: 'toggle', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'ZoomPanSync', label: 'Zoom/Pan Sync', type: 'toggle', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'WWXLSync', label: 'WW/WL Sync', type: 'toggle', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'ManualSync', label: 'Manual Sync', type: 'toggle', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Axial', label: 'Axial', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Coronal', label: 'Coronal', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Sagittal', label: 'Sagittal', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'MIP', label: 'MIP', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: '3D', label: '3D', type: 'action', status: 'deferred-advanced', placement: ['top-toolbar'] },
  { id: 'CompareMPR', label: 'Compare MPR', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'CurvedMPR', label: 'Curved MPR', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'TextMarker', label: 'Text Marker', type: 'tool', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Eraser', label: 'Eraser', type: 'tool', status: 'deferred-advanced', placement: ['top-toolbar', 'left-panel'] },
  { id: 'CropImage', label: 'Crop Image', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'FullviewSnapshot', label: 'Fullview Snap', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'ActionHistory', label: 'Action History', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'EncodePatient', label: 'Encode Patient', type: 'action', status: 'guarded', placement: ['left-panel'] },
  { id: 'DownloadManager', label: 'Downloads', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'OpenFolder', label: 'Open Folder', type: 'action', status: 'deferred-native', placement: ['left-panel'] },
  { id: 'VideoConference', label: 'Video Conf', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'FiveDReporting', label: '5D Reporting', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Share', label: 'Share', type: 'action', status: 'deferred-advanced', placement: ['left-panel'] },
  { id: 'Close', label: 'Close', type: 'action', status: 'ready', placement: ['top-toolbar'] },

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
    toolIds: ['Bidirectional', 'EllipticalROI', 'CircleROI', 'RectangleROI', 'CalibrationLine', 'Caliper', 'AngleVector', 'PolygonROI', 'MirrorROI'],
  },
  {
    id: 'advanced-tools',
    title: 'Advance Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['DoubleLength', 'NASCET', 'Volume', 'BrainMirror', 'VolumePolygon', 'Cardiopulmonary', 'Mammography', 'Reconstruction', 'ExportVideo'],
  },
  {
    id: 'imagetools',
    title: 'Image Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Capture', 'SaveSnapshot', 'FreeRotate'],
  },
  {
    id: 'sync-tools',
    title: 'Sync Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['ReferenceLines', 'StackImageSync', 'AutoSync', 'Crosshair3D', 'ZoomPanSync', 'WWXLSync', 'ManualSync'],
  },
  {
    id: 'mpr-tools',
    title: 'MPR Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Crosshairs', 'FusionMPR', 'Axial', 'Coronal', 'Sagittal', 'MIP', 'CompareMPR', 'CurvedMPR'],
  },
  {
    id: 'annotation',
    title: 'Annotation Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['ArrowAnnotate', 'PlanarFreehandROI', 'TextAnnotation', 'AILabeling', 'TextMarker', 'Eraser'],
  },
  {
    id: 'capture-info',
    title: 'Capture Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Capture', 'Gallery', 'CropImage', 'FullviewSnapshot'],
  },
  {
    id: 'more-tools',
    title: 'More Tools',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: true,
    toolIds: ['Report', 'ReportWorkspace', 'Diagnostics', 'TagBrowser', 'PACSConfig', 'UserConfig', 'About', 'Print', 'DirectPrint', 'CDBurn', 'ActionHistory', 'EncodePatient', 'DownloadManager', 'OpenFolder', 'VideoConference', 'FiveDReporting', 'Share'],
  },
];
