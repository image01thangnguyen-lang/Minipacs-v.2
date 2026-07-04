// Configuration for MiniPACS Viewport Overlays
export const minipacsViewportOverlayConfig = {
  topLeft: [
    { id: 'minipacs-study-line', customizationType: 'minipacs.overlayItem.studyLine' },
    { id: 'minipacs-series-line', customizationType: 'minipacs.overlayItem.seriesLine' },
  ],
  topRight: [
    { id: 'minipacs-series-index', customizationType: 'minipacs.overlayItem.seriesIndex' },
    { id: 'minipacs-image-index', customizationType: 'ohif.overlayItem.instanceNumber' },
    { id: 'minipacs-mini-toolbar', customizationType: 'minipacs.overlayItem.miniToolbar' },
  ],
  bottomRight: [
    { id: 'minipacs-zoom', customizationType: 'ohif.overlayItem.zoomLevel' },
    { id: 'minipacs-window-level', customizationType: 'ohif.overlayItem.windowLevel' },
  ],
  bottomLeft: [
    { id: 'minipacs-advanced-hud', customizationType: 'minipacs.overlayItem.advancedHud' },
    { id: 'minipacs-cine-hud', customizationType: 'minipacs.overlayItem.cineHud' },
  ]
};
