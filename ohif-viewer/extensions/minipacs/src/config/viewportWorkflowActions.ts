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
    id: 'ExportVideo',
    label: 'Export Video',
    type: 'action',
    status: 'backend',
    placement: ['viewport-toolbar', 'series-menu'],
  },
  {
    id: 'DownloadSeries',
    label: 'Download Series',
    type: 'action',
    status: 'backend',
    placement: ['viewport-toolbar', 'series-menu'],
  },
];
