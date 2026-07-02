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
  deferredReason?: string;
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
  { id: 'CobbAngle', label: 'Cobb Angle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'EllipticalROI', label: 'Ellipse', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CircleROI', label: 'Circle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'RectangleROI', label: 'Rectangle', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'CalibrationLine', label: 'Calibration', type: 'tool', status: 'ready', placement: ['left-panel'] },
  // Advanced Measurements
  { id: 'DoubleLength', label: 'Double Length', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom 2-line ratio logic (Phase 3)', placement: ['left-panel'] },
  { id: 'NASCET', label: 'NASCET/ESCT', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires specific calculation logic (Phase 3)', placement: ['left-panel'] },
  { id: 'Volume', label: 'Volume', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires 3D volume integration (Phase 4)', placement: ['left-panel'] },

  // --- Annotation Tools ---
  { id: 'ArrowAnnotate', label: 'Arrow', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'PlanarFreehandROI', label: 'Freehand', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'TextAnnotation', label: 'Text Annotation', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom text-only tool (Phase 3)', placement: ['left-panel'] },
  { id: 'AILabeling', label: 'AI Labeling', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires AI backend (Phase 3+)', placement: ['left-panel'] },

  // --- Image Manipulation Tools ---
  { id: 'RotateLeft', label: 'Rotate -90', type: 'action', commandName: 'rotateViewportCCW', status: 'ready', placement: ['top-toolbar'] },
  { id: 'RotateRight', label: 'Rotate +90', type: 'action', commandName: 'rotateViewportCW', status: 'ready', placement: ['top-toolbar'] },
  { id: 'FlipHorizontal', label: 'Flip H', type: 'action', commandName: 'flipViewportHorizontal', status: 'ready', placement: ['top-toolbar'] },
  { id: 'FlipVertical', label: 'Flip V', type: 'action', commandName: 'flipViewportVertical', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Invert', label: 'Invert', type: 'action', commandName: 'invertViewport', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Magnify', label: 'Magnify', type: 'tool', status: 'ready', placement: ['top-toolbar'] },
  { id: 'Cine', label: 'Cine', type: 'toggle', commandName: 'toggleCine', status: 'ready', placement: ['top-toolbar'] },

  // --- MPR & Sync Tools ---
  { id: 'MPR', label: 'MPR', type: 'action', commandName: 'toggleMiniPacsMpr', context: 'DEFAULT', status: 'deferred-advanced', deferredReason: 'Requires 3D Volume Integration (Phase 4)', placement: ['top-toolbar'] },
  { id: 'ReferenceLines', label: 'Ref Lines', type: 'toggle', commandName: 'setToolActive', commandOptions: { toolName: 'ReferenceLines' }, status: 'ready', placement: ['left-panel'] },
  { id: 'StackImageSync', label: 'Stack Sync', type: 'toggle', commandName: 'toggleStackImageSync', status: 'ohif-service', placement: ['left-panel'] },
  { id: 'FusionMPR', label: 'Fusion on MPR', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D Volume Integration (Phase 4)', placement: ['left-panel'] },

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
  { id: 'DeleteSeries', label: 'Delete Series', type: 'action', status: 'guarded', deferredReason: 'Requires Server-side implementation (Phase 3)', placement: ['series-menu'], destructive: true },

  // --- History & More Tools ---
  { id: 'StudyHistory', label: 'History', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Report', label: 'Report', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'ReportWorkspace', label: 'Report Ws', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Diagnostics', label: 'Diagnostics', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'PACSConfig', label: 'PACS Config', type: 'action', status: 'guarded', deferredReason: 'Requires Admin APIs (Phase 3)', placement: ['left-panel'] },
  { id: 'UserConfig', label: 'User Config', type: 'action', status: 'guarded', deferredReason: 'Requires User Config APIs (Phase 3)', placement: ['left-panel'] },
  { id: 'About', label: 'About', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Print', label: 'Browser Print', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'DirectPrint', label: 'DICOM Print', type: 'action', status: 'deferred-native', deferredReason: 'Requires Native Desktop App (Phase 5)', placement: ['left-panel'] },
  { id: 'CDBurn', label: 'Burn CD/DVD', type: 'action', status: 'deferred-native', deferredReason: 'Requires Native Desktop App (Phase 5)', placement: ['left-panel'] },

  // --- Missing 100+ Tools for Phase 1 ---
  { id: 'Caliper', label: 'Caliper', type: 'tool', status: 'deferred-advanced', deferredReason: 'Needs custom calibration UI (Phase 3)', placement: ['left-panel'] },
  { id: 'AngleVector', label: 'Angle Vector', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom angle logic (Phase 3)', placement: ['left-panel'] },
  { id: 'PolygonROI', label: 'Polygon', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom polyline tool (Phase 3)', placement: ['left-panel'] },
  { id: 'MirrorROI', label: 'Mirror ROI', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires mirror layout mapping (Phase 3)', placement: ['left-panel'] },
  { id: 'BrainMirror', label: 'Brain Mirror', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires mirror layout mapping (Phase 3)', placement: ['left-panel'] },
  { id: 'VolumePolygon', label: 'Volume Polygon', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires specialized processing (Phase 4+)', placement: ['left-panel'] },
  { id: 'Cardiopulmonary', label: 'Cardiopulmonary', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires specialized processing (Phase 4+)', placement: ['left-panel'] },
  { id: 'Mammography', label: 'Mammography', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires specialized processing (Phase 4+)', placement: ['left-panel'] },
  { id: 'Reconstruction', label: 'Reconstruction', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires specialized processing (Phase 4+)', placement: ['left-panel'] },
  { id: 'ExportVideo', label: 'Export Video', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires video encoding (Phase 3+)', placement: ['left-panel'] },
  { id: 'FreeRotate', label: 'Free Rotate', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires image rotation filter (Phase 3)', placement: ['left-panel'] },
  { id: 'AutoSync', label: 'Auto Sync', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires advanced SyncGroup management (Phase 3)', placement: ['left-panel'] },
  { id: 'Crosshair3D', label: 'Crosshair 3D', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires advanced SyncGroup management (Phase 3)', placement: ['left-panel'] },
  { id: 'ZoomPanSync', label: 'Zoom/Pan Sync', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires advanced SyncGroup management (Phase 3)', placement: ['left-panel'] },
  { id: 'WWXLSync', label: 'WW/WL Sync', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires advanced SyncGroup management (Phase 3)', placement: ['left-panel'] },
  { id: 'ManualSync', label: 'Manual Sync', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires advanced SyncGroup management (Phase 3)', placement: ['left-panel'] },
  { id: 'Axial', label: 'Axial', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: 'Coronal', label: 'Coronal', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: 'Sagittal', label: 'Sagittal', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: 'MIP', label: 'MIP', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: '3D', label: '3D', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['top-toolbar'] },
  { id: 'CompareMPR', label: 'Compare MPR', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: 'CurvedMPR', label: 'Curved MPR', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 3D MPR (Phase 4)', placement: ['left-panel'] },
  { id: 'TextMarker', label: 'Text Marker', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom marker tool (Phase 3)', placement: ['left-panel'] },
  { id: 'Eraser', label: 'Eraser', type: 'tool', status: 'deferred-advanced', deferredReason: 'Needs custom Eraser logic (Phase 3)', placement: ['top-toolbar', 'left-panel'] },
  { id: 'CropImage', label: 'Crop Image', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires crop workflow (Phase 3)', placement: ['left-panel'] },
  { id: 'FullviewSnapshot', label: 'Fullview Snap', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires custom canvas capture (Phase 3)', placement: ['left-panel'] },
  { id: 'ActionHistory', label: 'Action History', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires action history state (Phase 3)', placement: ['left-panel'] },
  { id: 'EncodePatient', label: 'Encode Patient', type: 'action', status: 'guarded', deferredReason: 'Requires Backend API (Phase 3)', placement: ['left-panel'] },
  { id: 'DownloadManager', label: 'Downloads', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires download manager (Phase 3)', placement: ['left-panel'] },
  { id: 'OpenFolder', label: 'Open Folder', type: 'action', status: 'deferred-native', deferredReason: 'Requires Native Desktop App (Phase 5)', placement: ['left-panel'] },
  { id: 'VideoConference', label: 'Video Conf', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires WebRTC backend (Phase 3+)', placement: ['left-panel'] },
  { id: 'FiveDReporting', label: '5D Reporting', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires 5D reporting module (Phase 3+)', placement: ['left-panel'] },
  { id: 'Share', label: 'Share', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires Sharing API (Phase 3)', placement: ['left-panel'] },
  { id: 'Close', label: 'Close', type: 'action', commandName: 'navigateHistory', commandOptions: { to: '/' }, context: 'DEFAULT', status: 'ready', placement: ['top-toolbar'] },

  // --- Phase 3 Advanced Display ---
  { id: 'DisplayImageOnly', label: 'Image Only', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires custom UI overlay logic (Phase 3)', placement: ['top-toolbar', 'left-panel'] },
  { id: 'Zoom100', label: '100% Zoom', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires parallelScale calculation (Phase 3)', placement: ['top-toolbar'] },
  { id: 'ActualSize', label: 'Actual Size', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires parallelScale calculation (Phase 3)', placement: ['top-toolbar'] },
  { id: 'SelectAll', label: 'Select All', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires selection state (Phase 3)', placement: ['left-panel'] },
  { id: 'SelectAllInverse', label: 'Select Inverse', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires selection state (Phase 3)', placement: ['left-panel'] },
  { id: 'SelectImageSet', label: 'Select Set', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires selection state (Phase 3)', placement: ['left-panel'] },
  { id: 'MonitorCine', label: 'Monitor Cine', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires global cine sync (Phase 3)', placement: ['top-toolbar'] },
  { id: 'AutoScroll', label: 'Auto Scroll', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires auto-scroll loop (Phase 3)', placement: ['top-toolbar'] },
  { id: 'RefreshExam', label: 'Refresh Exam', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires reload workflow (Phase 3)', placement: ['left-panel'] },
  { id: 'AutoRefresh', label: 'Auto Refresh', type: 'toggle', status: 'deferred-advanced', deferredReason: 'Requires polling service (Phase 3)', placement: ['left-panel'] },
  { id: 'ApplyPreviousHP', label: 'Prev HP', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires HP Manager (Phase 3)', placement: ['left-panel'] },
  { id: 'ApplyNextHP', label: 'Next HP', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires HP Manager (Phase 3)', placement: ['left-panel'] },
  { id: 'AdvancedThumbnail', label: 'Adv Thumbnail', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires thumbnail redesign (Phase 3)', placement: ['left-panel'] },

  // --- Phase 3 Shutters & Filters ---
  { id: 'EllipseShutter', label: 'Ellipse Shutter', type: 'tool', commandOptions: { toolName: 'EllipseShutter' }, status: 'deferred-advanced', deferredReason: 'Requires Shutter persistence and toolGroup validation (Phase 3)', placement: ['left-panel'] },
  { id: 'RectangleShutter', label: 'Rect Shutter', type: 'tool', commandOptions: { toolName: 'RectangleShutter' }, status: 'deferred-advanced', deferredReason: 'Requires Shutter persistence and toolGroup validation (Phase 3)', placement: ['left-panel'] },
  { id: 'PolylineShutter', label: 'Poly Shutter', type: 'tool', commandOptions: { toolName: 'PolylineShutter' }, status: 'deferred-advanced', deferredReason: 'Requires Shutter persistence and toolGroup validation (Phase 3)', placement: ['left-panel'] },
  { id: 'FilterSharpen', label: 'Sharpen', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires WebGL filter hook (Phase 3)', placement: ['left-panel'] },
  { id: 'FilterAverage', label: 'Average', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires WebGL filter hook (Phase 3)', placement: ['left-panel'] },
  { id: 'PseudoColor', label: 'Pseudo Color', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires Colormap logic (Phase 3)', placement: ['left-panel'] },

  // --- Phase 3 Specialty Measurements ---
  { id: 'CTRatio', label: 'CT Ratio', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'CTRatio2', label: 'CT Ratio 2', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'LLD', label: 'LLD', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Calibration Check (Phase 3)', placement: ['left-panel'] },
  { id: 'CenterLine', label: 'Center Line', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'Profile', label: 'Profile', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Pixel Sampling (Phase 3)', placement: ['left-panel'] },
  { id: 'Table2D', label: '2D Table', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires Statistics UI (Phase 3)', placement: ['left-panel'] },
  { id: 'SpineLabel', label: 'Spine Label', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom Marker (Phase 3)', placement: ['left-panel'] },
  { id: 'CenterLineAngle', label: 'CL Angle', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'MultipleCircle', label: 'Multi Circle', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'MultipleCobb', label: 'Multi Cobb', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'TimeIntensityCurve', label: 'TIC', type: 'action', status: 'deferred-advanced', deferredReason: 'Requires Multiframe Chart (Phase 3)', placement: ['left-panel'] },
  { id: 'Curve', label: 'Curve', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'AcetabularAngle', label: 'Acetabular Angle', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'SpineBalance', label: 'Spine Balance', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'SpinePelvicIncidence', label: 'Pelvic Incidence', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },
  { id: 'ParallelLine', label: 'Parallel Line', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires Custom BaseTool (Phase 3)', placement: ['left-panel'] },

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
    toolIds: ['Bidirectional', 'EllipticalROI', 'CircleROI', 'RectangleROI', 'CalibrationLine', 'Caliper', 'AngleVector', 'PolygonROI', 'MirrorROI', 'CobbAngle'],
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
  {
    id: 'phase3-advanced-display',
    title: 'Phase 3: Display & Workflow',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['DisplayImageOnly', 'Zoom100', 'ActualSize', 'SelectAll', 'SelectAllInverse', 'SelectImageSet', 'MonitorCine', 'AutoScroll', 'RefreshExam', 'AutoRefresh', 'ApplyPreviousHP', 'ApplyNextHP', 'AdvancedThumbnail'],
  },
  {
    id: 'phase3-shutters-filters',
    title: 'Phase 3: Shutters & Filters',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['EllipseShutter', 'RectangleShutter', 'PolylineShutter', 'FilterSharpen', 'FilterAverage', 'PseudoColor'],
  },
  {
    id: 'phase3-measurements',
    title: 'Phase 3: Specialty Measurements',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['CTRatio', 'CTRatio2', 'LLD', 'CenterLine', 'Profile', 'Table2D', 'SpineLabel', 'CenterLineAngle', 'MultipleCircle', 'MultipleCobb', 'TimeIntensityCurve', 'Curve', 'AcetabularAngle', 'SpineBalance', 'SpinePelvicIncidence', 'ParallelLine'],
  },
];
