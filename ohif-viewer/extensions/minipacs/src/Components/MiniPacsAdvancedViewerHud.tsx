import React, { useEffect, useState } from 'react';


interface Props {
  viewportId: string;
  servicesManager: any;
}

export function MiniPacsAdvancedViewerHud({ viewportId, servicesManager }: Props) {
  const [eligibility, setEligibility] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [isMprActive, setIsMprActive] = useState(false);

  useEffect(() => {
    // Check eligibility when viewport mounts or updates
    const { viewportGridService, displaySetService, hangingProtocolService } = servicesManager.services;
    
    const checkEligibility = () => {
      try {
        const gridState = viewportGridService.getState();
        const viewportInfo = gridState.viewports.get(viewportId);
        
        if (!viewportInfo || !viewportInfo.displaySetInstanceUIDs || viewportInfo.displaySetInstanceUIDs.length === 0) {
          setEligibility(null);
          return;
        }

        const displaySet = displaySetService.getDisplaySetByUID(viewportInfo.displaySetInstanceUIDs[0]);
        if (!displaySet) {
          setEligibility(null);
          return;
        }

        if (!displaySet.isReconstructable) {
          setEligibility({ ok: false, reason: 'Series is not reconstructable' });
        } else if (displaySet.Modality !== 'CT' && displaySet.Modality !== 'MR' && displaySet.Modality !== 'PT') {
          setEligibility({ ok: false, reason: `Modality ${displaySet.Modality} not supported` });
        } else {
          setEligibility({ ok: true });
        }

        const hpState = hangingProtocolService.getState();
        setIsMprActive(hpState && (hpState.protocolId === 'mpr' || hpState.protocolId === 'mprAnd3DVolumeViewport'));
      } catch (e) {
        setEligibility(null);
      }
    };

    checkEligibility();

    // Subscribe to viewport grid changes to re-evaluate
    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      checkEligibility
    );
    const layoutSubscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.LAYOUT_CHANGED,
      checkEligibility
    );

    return () => {
      subscription.unsubscribe();
      layoutSubscription.unsubscribe();
    };
  }, [viewportId, servicesManager]);

  if (!eligibility) {
    return null;
  }

  return (
    <div className="absolute top-14 left-2 z-50 pointer-events-none">
      {isMprActive ? (
        <div className="bg-[#00B5B8] text-white text-xs font-semibold px-2 py-1 rounded shadow-md opacity-90">
          MPR/3D Active
        </div>
      ) : eligibility.ok ? (
        <div className="bg-[#1A323A] border border-[#00B5B8] text-[#00B5B8] text-xs font-medium px-2 py-1 rounded shadow-sm opacity-80">
          MPR Available
        </div>
      ) : (
        <div className="bg-[#102126] border border-[#ef4444] text-[#ef4444] text-[10px] font-medium px-2 py-1 rounded shadow-sm opacity-70" title={eligibility.reason}>
          Advanced Tools Disabled: {eligibility.reason}
        </div>
      )}
    </div>
  );
}
