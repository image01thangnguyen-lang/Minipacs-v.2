import React from 'react';
import ReactDOM from 'react-dom';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';
import MiniPacsViewportMiniToolbar from './MiniPacsViewportMiniToolbar';

function safeFormatDate(dateStr?: string, timeStr?: string, formatters?: any) {
  if (!dateStr) return '';
  const date = formatters?.formatDate ? formatters.formatDate(dateStr) : dateStr;
  const time = timeStr && formatters?.formatTime ? formatters.formatTime(timeStr) : '';
  return time ? `${date} ${time}` : date;
}

export function MinipacsStudyLineOverlayItem(props: any) {
  const { servicesManager, element, formatters } = props;
  const viewportId = element?.dataset?.viewportUid; // Or maybe it's not on dataset?
  
  // Actually, viewportId is passed in props according to CustomizableViewportOverlay.tsx
  // Wait, looking at CustomizableViewportOverlay.tsx: 
  // const overlayItemProps: OverlayItemProps = { element, viewportData, imageSliceData, viewportId, ... }
  // So viewportId is available!
  const { viewportId: propViewportId } = props;

  const state = getMiniPacsViewportState(propViewportId, servicesManager);
  
  const dateStr = safeFormatDate(state.StudyDate, state.StudyTime, formatters);
  const modality = state.Modality || '';
  const bodyPart = state.BodyPartExamined || '';

  const parts = [dateStr, modality, bodyPart].filter(Boolean);
  
  if (parts.length === 0) return null;

  return (
    <div className="overlay-item flex flex-row text-[#00B5B8] font-light text-[13px] tracking-wide drop-shadow-md">
      {parts.join(' - ')}
    </div>
  );
}

export function MinipacsSeriesLineOverlayItem(props: any) {
  const { servicesManager, viewportId } = props;
  const state = getMiniPacsViewportState(viewportId, servicesManager);
  
  const description = state.SeriesDescription;
  
  if (!description) return null;

  return (
    <div className="overlay-item flex flex-row text-[#00B5B8] font-light text-[13px] tracking-wide drop-shadow-md">
      {description}
    </div>
  );
}

export function MinipacsSeriesIndexOverlayItem(props: any) {
  const { servicesManager, viewportId } = props;
  const state = getMiniPacsViewportState(viewportId, servicesManager);
  
  const seriesIndex = state.seriesIndex;
  
  if (seriesIndex === undefined) return null;

  return (
    <div className="overlay-item flex flex-row text-[#00B5B8] font-light text-[13px] tracking-wide drop-shadow-md">
      <span className="mr-1 shrink-0">Se:</span>
      <span className="font-light">{seriesIndex}</span>
    </div>
  );
}

// A wrapper for the Mini Toolbar
export function MinipacsMiniToolbarOverlayItem(props: any) {
  const { servicesManager, viewportId, element } = props;
  
  // Render toolbar directly into the viewport wrapper to avoid TopRight overlay constraints
  const viewportWrapper = element?.parentElement;

  if (!viewportWrapper) return null;

  return ReactDOM.createPortal(
    <div 
      className="absolute flex flex-col justify-center items-center h-full pointer-events-none"
      style={{ 
        right: '4px', 
        top: '0', 
        zIndex: 50 
      }}
    >
      <div className="pointer-events-auto">
        <MiniPacsViewportMiniToolbar 
          viewportId={viewportId} 
          servicesManager={servicesManager} 
        />
      </div>
    </div>,
    viewportWrapper
  );
}

// A wrapper for the Cine HUD
import { MiniPacsCineHud } from './MiniPacsCineHud';

export function MinipacsCineHudOverlayItem(props: any) {
  const { servicesManager, viewportId, element } = props;
  
  const viewportWrapper = element?.parentElement;
  if (!viewportWrapper) return null;

  return ReactDOM.createPortal(
    <MiniPacsCineHud 
      viewportId={viewportId} 
      servicesManager={servicesManager} 
    />,
    viewportWrapper
  );
}

