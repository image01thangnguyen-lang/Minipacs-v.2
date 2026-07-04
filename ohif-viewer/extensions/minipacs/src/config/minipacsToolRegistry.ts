export type MiniPacsToolStatus =
  | 'ready'
  | 'ui-state'
  | 'ohif-service'
  | 'backend'
  | 'deferred-advanced'
  | 'deferred-native'
  | 'deferred-phase5'
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
  /** Capability keys from nativeCapabilityService that must be true for this tool */
  requiresCapability?: string[];
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
  { id: 'TextAnnotation', label: 'Text Annotation', type: 'tool', status: 'ready', placement: ['left-panel'] },
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
  { id: 'MPR', label: 'MPR', type: 'action', commandName: 'toggleMiniPacsMpr', context: 'DEFAULT', status: 'ready', placement: ['top-toolbar'] },
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
  { id: 'DeleteSeries', label: 'Delete Series', type: 'action', commandName: 'requestDeleteSeries', status: 'guarded', deferredReason: 'Requires reason and server policy', placement: ['series-menu'], destructive: true },

  // --- History & More Tools ---
  { id: 'StudyHistory', label: 'History', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Report', label: 'Report', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'ReportWorkspace', label: 'Report Ws', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Diagnostics', label: 'Diagnostics', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'PACSConfig', label: 'PACS Config', type: 'action', status: 'guarded', deferredReason: 'Requires Admin APIs (Phase 3)', placement: ['left-panel'] },
  { id: 'UserConfig', label: 'User Config', type: 'action', commandName: 'openViewerConfig', status: 'ready', placement: ['left-panel'] },
  { id: 'About', label: 'About', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'Print', label: 'Browser Print', type: 'action', status: 'ready', placement: ['left-panel'] },
  { id: 'DirectPrint', label: 'DICOM Print', type: 'action', status: 'deferred-native', deferredReason: 'Requires DICOM Print SCU via gateway or companion (Phase 5B)', requiresCapability: ['dicomPrintAvailable'], placement: ['left-panel'] },
  { id: 'CDBurn', label: 'Burn CD/DVD', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion with CD burn capability (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'cdBurnAvailable'], placement: ['left-panel'] },

  // --- Missing 100+ Tools for Phase 1 ---
  { id: 'Caliper', label: 'Caliper', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'AngleVector', label: 'Angle Vector', type: 'tool', status: 'deferred-advanced', deferredReason: 'Requires custom angle logic (Phase 3)', placement: ['left-panel'] },
  { id: 'PolygonROI', label: 'Polygon', type: 'tool', status: 'ready', placement: ['left-panel'] },
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
  { id: 'Axial', label: 'Axial', type: 'action', status: 'deferred-advanced', deferredReason: 'Pending OHIF orientation API integration', placement: ['left-panel'] },
  { id: 'Coronal', label: 'Coronal', type: 'action', status: 'deferred-advanced', deferredReason: 'Pending OHIF orientation API integration', placement: ['left-panel'] },
  { id: 'Sagittal', label: 'Sagittal', type: 'action', status: 'deferred-advanced', deferredReason: 'Pending OHIF orientation API integration', placement: ['left-panel'] },
  { id: 'MIP', label: 'MIP', type: 'action', commandName: 'toggleMiniPacsMipVolume', context: 'DEFAULT', status: 'ready', placement: ['left-panel'] },
  { id: '3D', label: '3D', type: 'action', commandName: 'toggleMiniPacsMipVolume', context: 'DEFAULT', status: 'ready', placement: ['top-toolbar'] },
  { id: 'CompareMPR', label: 'Compare MPR', type: 'action', status: 'deferred-advanced', deferredReason: 'Pending reslice engine stability (Phase 4)', placement: ['left-panel'] },
  { id: 'CurvedMPR', label: 'Curved MPR', type: 'action', status: 'deferred-advanced', deferredReason: 'Pending reslice engine stability (Phase 4)', placement: ['left-panel'] },
  { id: 'TextMarker', label: 'Text Marker', type: 'tool', status: 'ready', placement: ['left-panel'] },
  { id: 'Eraser', label: 'Eraser', type: 'tool', status: 'ready', placement: ['top-toolbar', 'left-panel'] },
  { id: 'CropImage', label: 'Crop Image', type: 'action', commandName: 'startCropCapture', context: 'DEFAULT', status: 'deferred-advanced', deferredReason: 'Requires Cornerstone canvas DOM logic (Phase 5)', placement: ['left-panel'] },
  { id: 'FullviewSnapshot', label: 'Fullview Snap', type: 'action', commandName: 'saveFullviewSnapshot', context: 'DEFAULT', status: 'deferred-advanced', deferredReason: 'Requires Cornerstone canvas DOM logic (Phase 5)', placement: ['left-panel'] },
  { id: 'ActionHistory', label: 'Action History', type: 'action', commandName: 'openActionHistory', context: 'DEFAULT', status: 'ready', placement: ['left-panel'] },
  { id: 'EncodePatient', label: 'Encode Patient', type: 'toggle', commandName: 'toggleAnonymizedDisplay', context: 'DEFAULT', status: 'deferred-advanced', deferredReason: 'Requires DOM/Overlay manipulation (Phase 5)', placement: ['left-panel'] },
  { id: 'DownloadManager', label: 'Downloads', type: 'action', commandName: 'openDownloadManager', context: 'DEFAULT', status: 'ready', placement: ['left-panel'] },
  { id: 'OpenFolder', label: 'Open Folder', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion or Electron mode (Phase 5B)', requiresCapability: ['localCompanionAvailable'], placement: ['left-panel'] },
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
  { id: 'CTRatio', label: 'CT Ratio', type: 'action', commandName: 'openCTRatioPanel', context: 'DEFAULT', status: 'guarded', deferredReason: 'Requires proper validation and Length tool integration', placement: ['left-panel'] },
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

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 5A — 3D Sculpt Tools
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'CropSculpt', label: 'Crop Sculpt', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'SculptInverse', label: 'Inverse', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active sculpt session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'SculptRemove', label: 'Remove', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active sculpt session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'], destructive: true },
  { id: 'SculptDone', label: 'Done', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active sculpt session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'SculptCancel', label: 'Cancel', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active sculpt session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'FreehandAreaSculpt', label: 'Freehand Area', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'CurvedAreaSculpt', label: 'Curved Area', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'EllipseAreaSculpt', label: 'Ellipse Area', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'RectAreaSculpt', label: 'Rect Area', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'CurvedLineSculpt', label: 'Curved Line', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'FreehandLineSculpt', label: 'Freehand Line', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js sculpt pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'UndoSculpt', label: 'Undo Sculpt', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active sculpt session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VOIMove', label: 'VOI Move', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js VOI pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VOIRotation', label: 'VOI Rotation', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js VOI pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VOIThickness', label: 'VOI Thickness', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js VOI pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VOICenter', label: 'VOI Center', type: 'tool', status: 'deferred-phase5', deferredReason: 'Requires VTK.js VOI pipeline (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 5A — Virtual Endoscopy Tools
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'VEAddPath', label: 'Add Path', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires validated volume data (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VERemovePath', label: 'Remove Path', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active endoscopy session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VECameraOnPath', label: 'Camera on Path', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active endoscopy path (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VECameraFree', label: 'Camera Free', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active endoscopy session (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VEForward', label: 'Forward', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active endoscopy path (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },
  { id: 'VEBackward', label: 'Backward', type: 'action', status: 'deferred-phase5', deferredReason: 'Requires active endoscopy path (Phase 5A)', requiresCapability: ['volumeRenderingAvailable'], placement: ['left-panel'] },

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 5B — Native/Desktop Tools
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'SendLocalDicom', label: 'Send DICOM', type: 'action', status: 'deferred-native', deferredReason: 'Requires server gateway DIMSE/STOW-RS (Phase 5B)', requiresCapability: ['serverGatewayAvailable'], placement: ['left-panel'] },
  { id: 'ScanDoc', label: 'Scan Doc', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion with scanner bridge (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'scannerAvailable'], placement: ['left-panel'] },
  { id: 'CaptureMonitor', label: 'Capture Monitor', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },
  { id: 'CaptureAllScreens', label: 'Capture All', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },
  { id: 'GlobalCapture', label: 'Global Capture', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },
  { id: 'Dictation', label: 'Dictation', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion or dictation service (Phase 5B)', requiresCapability: ['localCompanionAvailable'], placement: ['left-panel'] },
  { id: 'TapeDictation', label: 'Tape Dictation', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable'], placement: ['left-panel'] },
  { id: 'PlayDictation', label: 'Play Dictation', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable'], placement: ['left-panel'] },
  { id: 'Execute3DXelis', label: 'Xelis 3D', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion with Xelis installed (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink1', label: 'External 1', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink2', label: 'External 2', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink3', label: 'External 3', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink4', label: 'External 4', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink5', label: 'External 5', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLink6', label: 'External 6', type: 'action', status: 'deferred-native', deferredReason: 'Requires native companion (Phase 5B)', requiresCapability: ['localCompanionAvailable', 'externalLauncherAvailable'], placement: ['left-panel'] },
  { id: 'ExternalLinkDgate', label: 'D.gate', type: 'action', status: 'deferred-native', deferredReason: 'Requires server gateway or companion (Phase 5B)', requiresCapability: ['serverGatewayAvailable'], placement: ['left-panel'] },
  { id: 'SendToTFS', label: 'Send to TFS', type: 'action', status: 'deferred-native', deferredReason: 'Requires server gateway (Phase 5B)', requiresCapability: ['serverGatewayAvailable'], placement: ['left-panel'] },
  { id: 'NativeExit', label: 'Exit', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },
  { id: 'NativeMinimize', label: 'Minimize', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },
  { id: 'NativeResize', label: 'Resize', type: 'action', status: 'deferred-native', deferredReason: 'Requires Electron/Tauri mode (Phase 5B)', requiresCapability: ['electronMode'], placement: ['left-panel'] },

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
  {
    id: 'phase5a-sculpt',
    title: 'Phase 5A: 3D Sculpt',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['CropSculpt', 'SculptInverse', 'SculptRemove', 'SculptDone', 'SculptCancel', 'FreehandAreaSculpt', 'CurvedAreaSculpt', 'EllipseAreaSculpt', 'RectAreaSculpt', 'CurvedLineSculpt', 'FreehandLineSculpt', 'UndoSculpt', 'VOIMove', 'VOIRotation', 'VOIThickness', 'VOICenter'],
  },
  {
    id: 'phase5a-endoscopy',
    title: 'Phase 5A: Virtual Endoscopy',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['VEAddPath', 'VERemovePath', 'VECameraOnPath', 'VECameraFree', 'VEForward', 'VEBackward'],
  },
  {
    id: 'phase5b-native',
    title: 'Phase 5B: Native/Desktop',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['SendLocalDicom', 'ScanDoc', 'CaptureMonitor', 'CaptureAllScreens', 'GlobalCapture', 'Dictation', 'TapeDictation', 'PlayDictation', 'NativeExit', 'NativeMinimize', 'NativeResize'],
  },
  {
    id: 'phase5b-external',
    title: 'Phase 5B: External Integrations',
    placement: 'left-panel',
    renderType: 'icons',
    defaultOpen: false,
    toolIds: ['Execute3DXelis', 'ExternalLink1', 'ExternalLink2', 'ExternalLink3', 'ExternalLink4', 'ExternalLink5', 'ExternalLink6', 'ExternalLinkDgate', 'SendToTFS'],
  },
];
