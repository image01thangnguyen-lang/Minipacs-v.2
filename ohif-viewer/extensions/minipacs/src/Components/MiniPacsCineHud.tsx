import React, { useEffect, useState } from 'react';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';

const Icons = {
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Pause: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>,
};

export const MiniPacsCineHud = ({ viewportId, servicesManager }) => {
  const [state, setState] = useState(() => getMiniPacsViewportState(viewportId, servicesManager));

  useEffect(() => {
    // Basic polling or hook into cornerstone events would be better,
    // but for now we poll every 200ms when active/cine to update slice index
    const interval = setInterval(() => {
      const newState = getMiniPacsViewportState(viewportId, servicesManager);
      setState(newState);
    }, 200);
    return () => clearInterval(interval);
  }, [viewportId, servicesManager]);

  if (!state.canCine || !state.imageCount || state.imageCount <= 1) {
    return null;
  }

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const { viewportGridService, cineService } = servicesManager.services;
    viewportGridService.setActiveViewportId(viewportId);
    
    cineService.setCine({
      id: viewportId,
      isPlaying: !state.isCinePlaying,
    });
  };

  return (
    <div className="flex items-center bg-[#102126]/90 border border-[#00B5B8]/30 rounded-full px-4 py-1.5 gap-3 pointer-events-auto backdrop-blur-sm z-40 select-none shadow-lg">
      <div 
        className="text-[#00B5B8] hover:text-white cursor-pointer transition-colors p-1"
        onMouseDown={togglePlayPause}
        title={state.isCinePlaying ? "Pause" : "Play"}
      >
        {state.isCinePlaying ? <Icons.Pause /> : <Icons.Play />}
      </div>
      <div className="text-white text-xs font-medium min-w-[60px] text-center">
        {state.imageIndex || 1} / {state.imageCount}
      </div>
    </div>
  );
};
