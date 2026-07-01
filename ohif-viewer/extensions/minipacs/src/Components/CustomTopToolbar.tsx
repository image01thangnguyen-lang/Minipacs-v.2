import React, { useState } from 'react';

// ──────────────────── SVG Icon Components ────────────────────

const PanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
    <circle cx="12" cy="12" r="2" fill="#22d3ee" stroke="none" />
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    <circle cx="11" cy="11" r="3" fill="#22d3ee" opacity="0.4" stroke="none" />
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="6" rx="1" stroke="#f5b301" />
    <rect x="4" y="10" width="16" height="4" rx="1" fill="#f5b301" opacity="0.8" />
    <rect x="4" y="16" width="16" height="6" rx="1" stroke="#f5b301" />
  </svg>
);

const WindowLevelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" fill="#22d3ee" stroke="none" opacity="0.6"/>
  </svg>
);

const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/><line x1="4" y1="20" x2="4" y2="16"/><line x1="4" y1="20" x2="8" y2="20"/><line x1="20" y1="4" x2="20" y2="8"/><line x1="20" y1="4" x2="16" y2="4"/>
    <line x1="8" y1="16" x2="10" y2="18" stroke="#22d3ee" strokeWidth="2" />
    <line x1="12" y1="12" x2="14" y2="14" stroke="#22d3ee" strokeWidth="2" />
    <line x1="16" y1="8" x2="18" y2="10" stroke="#22d3ee" strokeWidth="2" />
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4L20 20"/>
    <path d="M9 15 Q 12 17 15 15" stroke="#f5b301" strokeWidth="2" />
  </svg>
);

const ProbeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
  </svg>
);

const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    <circle cx="12" cy="12" r="2.5" fill="#f5b301" stroke="none" />
  </svg>
);

const CrosshairsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const CursorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
    <path d="M13 13l6 6" stroke="#22d3ee" strokeWidth="2" />
  </svg>
);

const RotateLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" stroke="#ec4899" strokeWidth="2" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);
const RotateRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" stroke="#ec4899" strokeWidth="2" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const FlipHIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="12" y1="2" x2="12" y2="22" stroke="#22d3ee" strokeDasharray="2 2" strokeWidth="2" />
    <polyline points="5 8 2 12 5 16"/><polyline points="19 8 22 12 19 16"/>
  </svg>
);
const FlipVIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="2" y1="12" x2="22" y2="12" stroke="#22d3ee" strokeDasharray="2 2" strokeWidth="2" />
    <polyline points="8 5 12 2 16 5"/><polyline points="8 19 12 22 16 19"/>
  </svg>
);
const InvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20" fill="#f5b301" stroke="none" opacity="0.6"/>
  </svg>
);
const MagnifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <circle cx="11" cy="11" r="3" fill="#ec4899" opacity="0.5" stroke="none" />
  </svg>
);
const CineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="#ec4899" opacity="0.8" stroke="none"/>
  </svg>
);
const MPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/>
    <circle cx="17.5" cy="17.5" r="3.5" fill="#f5b301" stroke="none" />
  </svg>
);
const Box3DIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    <path d="M12 12 l8.7 -5.05 v10 l-8.7 5.05 z" fill="#22d3ee" opacity="0.3" stroke="none" />
  </svg>
);
const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20"/>
    <path d="M15 4L20 9L11 18L6 13Z" fill="#ec4899" opacity="0.3" stroke="none" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#ec4899" opacity="0.2" stroke="none" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="#ec4899" strokeWidth="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="#ec4899" strokeWidth="2"/>
  </svg>
);
const CaptureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4" fill="#22d3ee" opacity="0.6" stroke="none" />
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
                  disabled={isDisabled}
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
            disabled={isDisabled}
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
