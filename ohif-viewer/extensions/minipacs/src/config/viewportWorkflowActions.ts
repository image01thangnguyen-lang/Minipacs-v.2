import { MiniPacsTool } from './minipacsToolRegistry';

export const viewportWorkflowActions: MiniPacsTool[] = [
  {
    id: 'Fullscreen',
    label: 'Fullscreen / Restore',
    type: 'action',
    commandName: 'toggleFullscreen', // We will intercept this in commandBridge
    status: 'ready',
    placement: ['viewport-toolbar'],
  },
  {
    id: 'SaveSnapshot',
    label: 'Save Snapshot',
    type: 'action',
    status: 'ready',
    placement: ['viewport-toolbar'],
  },
  {
    id: 'Capture',
    label: 'Download',
    type: 'action',
    commandName: 'showDownloadViewportModal',
    status: 'ready',
    placement: ['viewport-toolbar'],
  },
  {
    id: 'LinkViewport',
    label: 'Link Viewports',
    type: 'action',
    commandName: 'toggleSync', // Custom bridge command
    status: 'ready',
    placement: ['viewport-toolbar'],
  },
  {
    id: 'KeyImage',
    label: 'Key Image',
    type: 'action',
    status: 'ready',
    placement: ['viewport-toolbar'],
  },
  {
    id: 'ExportVideoViewport',
    label: 'Export Video',
    type: 'action',
    status: 'backend',
    deferredReason: 'Requires video encoding service (Phase 3)',
    placement: ['viewport-toolbar', 'series-menu'],
  },
  {
    id: 'DownloadSeries',
    label: 'Download Series',
    type: 'action',
    status: 'backend',
    deferredReason: 'Requires ZIP generation service (Phase 3)',
    placement: ['viewport-toolbar', 'series-menu'],
  },
];
