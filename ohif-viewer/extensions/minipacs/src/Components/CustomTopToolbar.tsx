import React, { useState } from 'react';

// ──────────────────── SVG Icon Components ────────────────────

const PanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="6" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="6" rx="1"/>
  </svg>
);

const WindowLevelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3"/>
  </svg>
);

const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/><line x1="4" y1="20" x2="4" y2="16"/><line x1="4" y1="20" x2="8" y2="20"/><line x1="20" y1="4" x2="20" y2="8"/><line x1="20" y1="4" x2="16" y2="4"/>
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4L20 20"/>
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
  </svg>
);

const CrosshairsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

import { minipacsToolRegistry, MiniPacsTool } from '../config/minipacsToolRegistry';
import { runMiniPacsTool } from '../services/commandBridge';

// ──────────────────── Icon Registry ────────────────────

const iconMap: Record<string, React.FC> = {
  Pan: PanIcon,
  Zoom: ZoomIcon,
  StackScroll: StackScrollIcon,
  WindowLevel: WindowLevelIcon,
  Length: LengthIcon,
  Angle: AngleIcon,
  Probe: ProbeIcon,
  Reset: ResetIcon,
  Crosshairs: CrosshairsIcon,
};

export default function CustomTopToolbar({ servicesManager }) {
  const [activeTool, setActiveTool] = useState<string | null>('WindowLevel');
  const [toggledTools, setToggledTools] = useState<Record<string, boolean>>({});

  const { commandsManager } = servicesManager;

  const topTools = minipacsToolRegistry.filter(tool => tool.placement.includes('top-toolbar'));

  const windowLevelPresetIds = ['Default', 'Brain', 'Subdural', 'Stroke', 'Temporal', 'SoftTissue', 'Lung', 'Mediastinum', 'AbdomenSoft', 'Liver', 'SpineSoft', 'SpineBone'];
  const windowLevelTools = minipacsToolRegistry.filter(t => windowLevelPresetIds.includes(t.id));

  const handleToolClick = (item: MiniPacsTool) => {
    const result = runMiniPacsTool(servicesManager, commandsManager, item, { 
      toggledState: !toggledTools[item.id] 
    });

    if (result.ok) {
      if (item.type === 'tool') {
        setActiveTool(item.id);
      } else if (item.type === 'toggle') {
        setToggledTools(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      }
      setIsWlMenuOpen(false); // Close menu if an action is clicked
    } else if (result.reason === 'not_implemented') {
      alert(result.message || 'Tính năng chưa được hỗ trợ.');
    }
  };

  const [isWlMenuOpen, setIsWlMenuOpen] = useState(false);

  return (
    <div className="flex h-full items-center gap-1 relative">
      {topTools.map((item) => {
        const Icon = iconMap[item.id] || (() => <div className="w-4 h-4 rounded-full border border-current opacity-50" />);
        
        const isActive = item.type === 'tool' && activeTool === item.id;
        const isToggled = item.type === 'toggle' && toggledTools[item.id];
        const isDisabled = ['backend', 'advanced', 'guarded'].includes(item.status);

        if (item.id === 'WindowLevel') {
          return (
            <div key={item.id} className="flex items-center">
              <button
                title={item.label}
                disabled={isDisabled}
                className={`
                  w-[36px] h-[36px] flex items-center justify-center rounded-l
                  transition-all duration-150
                  ${isActive
                    ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] border border-[#00B5B8]'
                    : 'text-[#8899A6] hover:text-[#00B5B8] hover:bg-[#1A323A] border border-transparent'
                  }
                `}
                onClick={() => handleToolClick(item)}
              >
                <Icon />
              </button>
              <button
                className={`
                  w-[16px] h-[36px] flex items-center justify-center rounded-r border-l border-[#1A323A]
                  transition-all duration-150
                  ${isWlMenuOpen || isActive
                    ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] border-t border-r border-b border-[#00B5B8]'
                    : 'text-[#8899A6] hover:text-[#00B5B8] hover:bg-[#1A323A] border-t border-r border-b border-transparent'
                  }
                `}
                onClick={() => setIsWlMenuOpen(!isWlMenuOpen)}
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

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
            title={item.label + (isDisabled ? ' (Coming soon)' : '')}
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
