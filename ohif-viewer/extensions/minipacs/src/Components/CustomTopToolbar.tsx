import React, { useState } from 'react';

// ──────────────────── SVG Icon Components ────────────────────

const PanIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M11 5.5v-2a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M14 5.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M17 7.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7V9.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const ZoomIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="5" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="#ffffff" strokeWidth="2" />
    <line x1="10" y1="7" x2="10" y2="13" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="7" y1="10" x2="13" y2="10" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const StackScrollIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
    <rect x="4" y="6" width="16" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
    <rect x="3" y="10" width="18" height="5" rx="1" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.1" />
    <rect x="4" y="16" width="16" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
    <rect x="5" y="20" width="14" height="2" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
    <path d="M21 6l1.5 2.5L21 11" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
  </svg>
);

const WindowLevelIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 2a10 10 0 0 1 0 20Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1" />
    <line x1="12" y1="5" x2="12" y2="7" stroke="#000000" strokeWidth="1" />
    <line x1="16" y1="8" x2="14.5" y2="9.5" stroke="#000000" strokeWidth="1" />
    <line x1="17" y1="12" x2="15" y2="12" stroke="#000000" strokeWidth="1" />
  </svg>
);

const LengthIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="8" width="22" height="8" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.08" />
    <line x1="4" y1="8" x2="4" y2="13" stroke="#ffffff" strokeWidth="1" />
    <line x1="12" y1="8" x2="12" y2="13" stroke="#ffffff" strokeWidth="1" />
    <line x1="20" y1="8" x2="20" y2="13" stroke="#ffffff" strokeWidth="1" />
    <line x1="8" y1="8" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="16" y1="8" x2="16" y2="11.5" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="6" y1="8" x2="6" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="10" y1="8" x2="10" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="14" y1="8" x2="14" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="18" y1="8" x2="18" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <text x="3.5" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">0</text>
    <text x="11" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">5</text>
    <text x="18.5" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">10</text>
  </svg>
);

const AngleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20 A 12 12 0 0 1 20 20" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
    <line x1="4" y1="20" x2="20" y2="20" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="4" y1="20" x2="16" y2="5" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M9 20 A 5 5 0 0 1 8.2 15" stroke="#ffffff" strokeWidth="1.2" />
    <text x="10" y="18" fill="#ffffff" fontSize="4" fontFamily="monospace" opacity="0.7">°</text>
    <circle cx="4" cy="20" r="1.5" fill="#ffffff" />
  </svg>
);

const ProbeIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" stroke="#ffffff" strokeWidth="1" />
    <circle cx="12" cy="12" r="1" fill="#ffffff" />
    <line x1="12" y1="2" x2="12" y2="8" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="16" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="2" y1="12" x2="8" y2="12" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="16" y1="12" x2="22" y2="12" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="16" y="2" width="6" height="4" rx="1" stroke="#ffffff" strokeWidth="0.7" fill="#ffffff" fillOpacity="0.1" />
    <text x="17" y="4.8" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">HU</text>
  </svg>
);

const ResetIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 1 3 6.7" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="3 18 3 12 9 12" stroke="#ffffff" strokeWidth="1.5" />
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1" fill="#ffffff" fillOpacity="0.15" />
  </svg>
);

const CrosshairsIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
    <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
    <line x1="12" y1="2" x2="12" y2="8" stroke="#60a5fa" strokeWidth="1.5" />
    <line x1="12" y1="16" x2="12" y2="22" stroke="#60a5fa" strokeWidth="1.5" />
    <line x1="2" y1="12" x2="8" y2="12" stroke="#f87171" strokeWidth="1.5" />
    <line x1="16" y1="12" x2="22" y2="12" stroke="#f87171" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="#4ade80" />
  </svg>
);

const CursorIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" />
  </svg>
);

const RotateLeftIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1" opacity="0.4" transform="rotate(-15 12 12)" />
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <path d="M8 3 A 10 10 0 0 0 3 8" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="3 4 3 8 7 8" stroke="#ffffff" strokeWidth="1.5" fill="none" />
  </svg>
);

const RotateRightIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1" opacity="0.4" transform="rotate(15 12 12)" />
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <path d="M16 3 A 10 10 0 0 1 21 8" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="21 4 21 8 17 8" stroke="#ffffff" strokeWidth="1.5" fill="none" />
  </svg>
);

const FlipHIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
    <polygon points="10,6 3,12 10,18" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.2" />
    <polygon points="14,6 21,12 14,18" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" />
  </svg>
);

const FlipVIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
    <polygon points="6,10 12,3 18,10" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.2" />
    <polygon points="6,14 12,21 18,14" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" />
  </svg>
);

const InvertIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 2a10 10 0 0 0 0 20Z" fill="#ffffff" />
    <circle cx="12" cy="7" r="1.5" fill="#000000" />
    <circle cx="12" cy="17" r="1.5" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5" />
  </svg>
);

const MagnifyIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="4.5" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="2 1.5" />
    <ellipse cx="8" cy="8" rx="2" ry="1.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.4" transform="rotate(-30 8 8)" />
    <line x1="15" y1="15" x2="21" y2="21" stroke="#ffffff" strokeWidth="2.5" />
    <line x1="15" y1="15" x2="21" y2="21" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const CineIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="6" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
    <polygon points="10,7 18,12 10,17" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    <circle cx="12" cy="2.5" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="12" cy="21.5" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="2.5" cy="12" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="21.5" cy="12" r="1" fill="#ffffff" opacity="0.5" />
  </svg>
);

const MPRIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="4,8 12,4 20,8 12,12" fill="#60a5fa" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1" />
    <polygon points="20,8 20,16 12,20 12,12" fill="#f87171" fillOpacity="0.25" stroke="#f87171" strokeWidth="1" />
    <polygon points="4,8 4,16 12,20 12,12" fill="#4ade80" fillOpacity="0.25" stroke="#4ade80" strokeWidth="1" />
  </svg>
);

const Box3DIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* 3D Box Volume */}
    <polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="21" x2="12" y2="12" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
    <line x1="12" y1="12" x2="20" y2="7.5" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
    <line x1="12" y1="12" x2="4" y2="7.5" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
  </svg>
);

const EraserIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Rubber Eraser block */}
    <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <line x1="20" y1="20" x2="11" y2="20" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="15" y1="4" x2="20" y2="9" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* X Close button */}
    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" fill="#ef4444" fillOpacity="0.1" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="1.5" />
    <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="1.5" />
  </svg>
);

const CaptureIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Camera */}
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <circle cx="12" cy="13" r="4" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="12" cy="13" r="2" stroke="#ffffff" strokeWidth="0.8" fill="#ffffff" fillOpacity="0.15" />
    <circle cx="18" cy="8" r="1" fill="#ffffff" opacity="0.5" />
  </svg>
);

// New tools
const DisplayImageOnlyIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Fullscreen monitor */}
    <rect x="2" y="4" width="20" height="14" rx="2" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.1" />
    <path d="M8 22h8" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 18v4" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="7 10 7 7 10 7" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
    <polyline points="17 14 17 17 14 17" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
  </svg>
);

const Zoom100Icon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Magnifier with 1:1 text */}
    <circle cx="10" cy="10" r="8" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <line x1="16" y1="16" x2="22" y2="22" stroke="#ffffff" strokeWidth="2.5" />
    <text x="6" y="12.5" fill="#ffffff" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">1:1</text>
  </svg>
);

const ActualSizeIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Ruler showing actual 1 cm/inch */}
    <rect x="2" y="8" width="20" height="8" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.1" />
    <line x1="6" y1="8" x2="6" y2="12" stroke="#ffffff" strokeWidth="1" />
    <line x1="12" y1="8" x2="12" y2="14" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="18" y1="8" x2="18" y2="12" stroke="#ffffff" strokeWidth="1" />
    <text x="10" y="16.5" fill="#ffffff" fontSize="4.5" fontFamily="monospace">1X</text>
  </svg>
);

const MonitorCineIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Monitor with play button */}
    <rect x="2" y="4" width="20" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="8" y1="22" x2="16" y2="22" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="12" y1="18" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.5" />
    <polygon points="10 8 16 11 10 14" fill="#ffffff" />
  </svg>
);

const AutoScrollIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Mouse scroll wheel / auto up down */}
    <rect x="7" y="5" width="10" height="14" rx="5" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="8" x2="12" y2="11" stroke="#ffffff" strokeWidth="1.5" />
    {/* Animated-looking arrows */}
    <polyline points="15 15 12 18 9 15" stroke="#ffffff" strokeWidth="1.2" />
    <polyline points="15 3 12 0 9 3" stroke="#ffffff" strokeWidth="1.2" />
  </svg>
);

import { minipacsToolRegistry, MiniPacsTool } from '../config/minipacsToolRegistry';
import { runMiniPacsTool } from '../services/commandBridge';

// ──────────────────── Icon Registry ────────────────────

const iconMap: Record<string, React.FC> = {
  Cursor: CursorIcon,
  Pan: PanIcon,
  Zoom: ZoomIcon,
  StackScroll: StackScrollIcon,
  WindowLevel: WindowLevelIcon,
  Length: LengthIcon,
  Angle: AngleIcon,
  Probe: ProbeIcon,
  Reset: ResetIcon,
  Crosshairs: CrosshairsIcon,
  RotateLeft: RotateLeftIcon,
  RotateRight: RotateRightIcon,
  FlipHorizontal: FlipHIcon,
  FlipVertical: FlipVIcon,
  Invert: InvertIcon,
  Magnify: MagnifyIcon,
  Cine: CineIcon,
  MPR: MPRIcon,
  '3D': Box3DIcon,
  Eraser: EraserIcon,
  Close: CloseIcon,
  Capture: CaptureIcon,
  // New tools
  DisplayImageOnly: DisplayImageOnlyIcon,
  Zoom100: Zoom100Icon,
  ActualSize: ActualSizeIcon,
  MonitorCine: MonitorCineIcon,
  AutoScroll: AutoScrollIcon,
};

export default function CustomTopToolbar({ servicesManager }) {
  const [activeTool, setActiveTool] = useState<string | null>('Cursor');
  const [toggledTools, setToggledTools] = useState<Record<string, boolean>>({});

  const { toolbarService } = servicesManager.services || servicesManager;

  React.useEffect(() => {
    if (!toolbarService) return;
    const subscription = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      (state: any) => {
        setToggledTools({ ...state.toggles });
        if (state.primaryToolId) setActiveTool(state.primaryToolId);
      }
    );
    setToggledTools({ ...toolbarService.state.toggles });
    if (toolbarService.state.primaryToolId) setActiveTool(toolbarService.state.primaryToolId);
    return () => subscription.unsubscribe();
  }, [toolbarService]);

  const { commandsManager } = servicesManager;

  const topTools = minipacsToolRegistry.filter(tool => tool.placement.includes('top-toolbar'));

  const windowLevelPresetIds = ['Default', 'Brain', 'Subdural', 'Stroke', 'Temporal', 'SoftTissue', 'Lung', 'Mediastinum', 'AbdomenSoft', 'Liver', 'SpineSoft', 'SpineBone'];
  const windowLevelTools = minipacsToolRegistry.filter(t => windowLevelPresetIds.includes(t.id));

  const handleToolClick = (item: MiniPacsTool) => {
    if (item.id === 'Cursor') {
      setActiveTool('Cursor');
      setIsWlMenuOpen(false);
      try {
        const { toolGroupService, cornerstoneViewportService } = servicesManager.services;
        const toolGroupIds = toolGroupService.getToolGroupIds();
        toolGroupIds.forEach(id => {
          const toolGroup = toolGroupService.getToolGroup(id);
          if (toolGroup) {
            ['WindowLevel', 'Pan', 'Zoom', 'Length', 'ArrowAnnotate', 'Probe', 'Crosshairs', 'Angle', 'StackScrollMouseWheel'].forEach(t => {
               try { toolGroup.setToolPassive(t); } catch(e) {}
            });
          }
        });

        // Force reset cursors on all viewports
        if (cornerstoneViewportService) {
          const renderingEngine = cornerstoneViewportService.getRenderingEngine();
          if (renderingEngine) {
            renderingEngine.getViewports().forEach(vp => {
              if (vp.element) {
                vp.element.style.cursor = 'default';
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to set tools passive:', e);
      }
      return;
    }

    const effectiveId = item.commandName === 'toggleSync' ? 'StackImageSync' : item.id;
    const result = runMiniPacsTool(servicesManager, item, { 
      toggledState: !toggledTools[effectiveId] 
    });

    if (result.ok) {
      setIsWlMenuOpen(false); // Close menu if an action is clicked
      // activeTool and toggledTools state handled by subscription
    }
  };

  const [isWlMenuOpen, setIsWlMenuOpen] = useState(false);

  return (
    <div className="flex h-full items-center gap-1 relative">
      {topTools.map((item) => {
        const Icon = iconMap[item.id] || (() => <div className="w-4 h-4 rounded-full border border-current opacity-50" />);
        
        const isActive = item.type === 'tool' && activeTool === item.id;
        const isToggled = item.type === 'toggle' && toggledTools[item.id];
        const isDisabled = ['backend', 'deferred-advanced', 'deferred-native', 'guarded'].includes(item.status);

        if (item.id === 'WindowLevel') {
          return (
            <div key={item.id} className="flex items-center relative">
              <div 
                className={`
                  flex items-center rounded transition-all duration-150
                  ${isWlMenuOpen || isActive
                    ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] border border-[#00B5B8]'
                    : 'text-[#8899A6] border border-transparent hover:border-[#1A323A]'
                  }
                `}
              >
                {/* Main Tool Button */}
                <button
                  title={item.label}
                  aria-disabled={isDisabled}
                  className={`w-[36px] h-[36px] flex items-center justify-center rounded-l ${isActive ? 'hover:text-[#00B5B8]' : 'hover:text-[#00B5B8] hover:bg-[#1A323A]'}`}
                  onClick={() => handleToolClick(item)}
                >
                  <Icon />
                </button>

                {/* Divider Line */}
                <div className={`w-[1px] h-[24px] ${isActive || isWlMenuOpen ? 'bg-[#00B5B8] opacity-50' : 'bg-[#1A323A]'}`} />

                {/* Dropdown Caret Button */}
                <button
                  className={`w-[16px] h-[36px] flex items-center justify-center rounded-r ${isWlMenuOpen ? 'bg-[#00B5B8] text-white hover:text-white' : isActive ? 'hover:text-[#00B5B8]' : 'hover:text-[#00B5B8] hover:bg-[#1A323A]'}`}
                  onClick={() => setIsWlMenuOpen(!isWlMenuOpen)}
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Dropdown Menu */}
              {isWlMenuOpen && (
                <div className="absolute top-[40px] left-0 mt-1 w-[220px] bg-[#202020] border border-[#303030] rounded shadow-lg z-50 flex flex-col py-2">
                  {windowLevelTools.map(wlTool => (
                    <button
                      key={wlTool.id}
                      className="text-left px-4 py-1.5 text-[12px] text-white hover:bg-[#333333] transition-colors"
                      onClick={() => handleToolClick(wlTool)}
                    >
                      {wlTool.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            title={item.label + (isDisabled ? (item.status === 'deferred-native' ? ' (Requires native app)' : ' (Coming soon)') : '')}
            aria-disabled={isDisabled}
            className={`
              w-[36px] h-[36px] flex items-center justify-center rounded
              transition-all duration-150
              ${isDisabled 
                ? 'text-[#4A5B66] cursor-not-allowed opacity-50' 
                : isActive || isToggled
                  ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] border border-[#00B5B8] cursor-pointer'
                  : 'text-[#8899A6] hover:text-[#00B5B8] hover:bg-[#1A323A] border border-transparent cursor-pointer'
              }
            `}
            onClick={() => handleToolClick(item)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
