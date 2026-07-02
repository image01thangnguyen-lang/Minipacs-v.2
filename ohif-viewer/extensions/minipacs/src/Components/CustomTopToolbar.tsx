import React, { useState } from 'react';

// ──────────────────── SVG Icon Components ────────────────────

const PanIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const ZoomIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const StackScrollIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="5" rx="1" />
    <rect x="4" y="9" width="16" height="5" rx="1" />
    <rect x="4" y="16" width="16" height="5" rx="1" />
    <path d="M8 9v5" />
    <path d="M16 9v5" />
  </svg>
);

const WindowLevelIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M12 6h4" />
    <path d="M12 10h6" />
    <path d="M12 14h6" />
    <path d="M12 18h4" />
  </svg>
);

const LengthIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="20" x2="20" y2="4" />
    <line x1="4" y1="16" x2="4" y2="20" />
    <line x1="4" y1="20" x2="8" y2="20" />
    <line x1="20" y1="4" x2="16" y2="4" />
    <line x1="20" y1="4" x2="20" y2="8" />
    <line x1="8" y1="16" x2="10" y2="18" />
    <line x1="12" y1="12" x2="14" y2="14" />
    <line x1="16" y1="8" x2="18" y2="10" />
  </svg>
);

const AngleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4L20 20" />
    <path d="M8 12 Q 12 15 16 12" />
    <line x1="12" y1="4" x2="12" y2="6" />
  </svg>
);

const ProbeIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill="#ffffff" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 3 12 9 12" />
    <path d="M4.5 16.5A9 9 0 1 0 3 12" />
  </svg>
);

const CrosshairsIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);

const CursorIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" />
  </svg>
);

const RotateLeftIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 8 3 2 9 2" />
    <path d="M3 8A9 9 0 1 1 2 12" />
  </svg>
);

const RotateRightIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 2 15 2" />
    <path d="M21 8A9 9 0 1 0 22 12" />
  </svg>
);

const FlipHIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4 4" />
    <polyline points="7 8 2 12 7 16" />
    <polyline points="17 8 22 12 17 16" />
  </svg>
);

const FlipVIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="4 4" />
    <polyline points="8 7 12 2 16 7" />
    <polyline points="8 17 12 22 16 17" />
  </svg>
);

const InvertIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M8 3v18" />
    <path d="M4.5 8v8" />
  </svg>
);

const MagnifyIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" />
    <line x1="21" y1="21" x2="15" y2="15" />
    <rect x="7" y="7" width="6" height="6" rx="1" />
  </svg>
);

const CineIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="6" y1="4" x2="6" y2="20" />
    <line x1="18" y1="4" x2="18" y2="20" />
    <line x1="2" y1="8" x2="6" y2="8" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="2" y1="16" x2="6" y2="16" />
    <line x1="18" y1="8" x2="22" y2="8" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="18" y1="16" x2="22" y2="16" />
    <polygon points="10 9 15 12 10 15" />
  </svg>
);

const MPRIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <line x1="14" y1="18" x2="20" y2="18" />
    <line x1="17" y1="15" x2="17" y2="21" />
  </svg>
);

const Box3DIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="12" x2="20" y2="7.5" />
    <line x1="12" y1="12" x2="4" y2="7.5" />
  </svg>
);

const EraserIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20" />
    <line x1="15" y1="4" x2="20" y2="9" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const CaptureIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
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
