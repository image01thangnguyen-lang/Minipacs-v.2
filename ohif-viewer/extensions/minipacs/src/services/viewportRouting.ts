export type RouteResult = {
  ok: boolean;
  reason?: string;
};

export function routeDisplaySetToActiveViewport({
  servicesManager,
  displaySetInstanceUID,
}: {
  servicesManager: any;
  displaySetInstanceUID: string;
}): RouteResult {
  const { viewportGridService } = servicesManager.services;
  const { activeViewportId, viewports } = viewportGridService.getState();

  // If no viewports are available at all, fail early
  if (!viewports || viewports.size === 0) {
    return { ok: false, reason: 'no_viewports' };
  }

  // Use active viewport, or fallback to the first viewport ID
  const viewportId = activeViewportId || Array.from(viewports.keys())[0];
  
  if (!viewportId) {
    return { ok: false, reason: 'no_active_viewport' };
  }

  return routeDisplaySetToViewport({
    servicesManager,
    viewportId,
    displaySetInstanceUID,
  });
}

export function routeDisplaySetToViewport({
  servicesManager,
  viewportId,
  displaySetInstanceUID,
}: {
  servicesManager: any;
  viewportId: string;
  displaySetInstanceUID: string;
}): RouteResult {
  const { hangingProtocolService, viewportGridService } = servicesManager.services;

  let updatedViewports = [];
  try {
    updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      viewportId,
      displaySetInstanceUID
    );
  } catch (error) {
    console.warn('[MiniPACS] Could not route display set to viewport', error);
    return { ok: false, reason: 'hanging_protocol_error' };
  }

  if (updatedViewports && updatedViewports.length > 0) {
    viewportGridService.setDisplaySetsForViewports(updatedViewports);
    return { ok: true };
  }

  return { ok: false, reason: 'no_updated_viewports' };
}
