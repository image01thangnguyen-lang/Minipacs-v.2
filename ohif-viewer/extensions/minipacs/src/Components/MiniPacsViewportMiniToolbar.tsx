import React from 'react';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';
import { runMiniPacsTool } from '../services/commandBridge';
import { ServicesManager } from '@ohif/core';

// --- Inline SVGs ---
const Camera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
);

const Maximize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
  </svg>
);

const Sun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const MoreVertical = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

import { VIEWPORT_MINI_TOOLS } from '../config/viewportMiniTools';

const ICON_MAP: Record<string, React.FC> = {
  Camera, Maximize, Sun, Link: LinkIcon, MoreVertical
};

interface MiniPacsViewportMiniToolbarProps {
  viewportId: string;
  servicesManager: ServicesManager;
}

export default function MiniPacsViewportMiniToolbar({ viewportId, servicesManager }: MiniPacsViewportMiniToolbarProps) {
  const { viewportGridService } = servicesManager.services;

  const handleToolClick = (e: React.MouseEvent, toolConfig: any) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Set this viewport as active
    viewportGridService.setActiveViewportId(viewportId);

    if (toolConfig.isPlaceholder) {
      console.log(`[MiniToolbar] ${toolConfig.action} clicked for viewport ${viewportId}. This is a Phase 5 placeholder.`);
      return;
    }

    // 2. Dispatch action
    runMiniPacsTool(servicesManager, {
      id: toolConfig.id,
      label: toolConfig.label,
      icon: toolConfig.icon,
      type: 'tool',
      status: 'ready',
      commandOptions: { toolName: toolConfig.toolName || toolConfig.id } // e.g. 'WindowLevel'
    });
  };

  const btnClass = "w-8 h-8 flex items-center justify-center text-[#00B5B8] hover:bg-[#00B5B8]/20 hover:text-white rounded transition-colors bg-[#102126]/80 backdrop-blur-sm border border-[#00B5B8]/30 mb-1 cursor-pointer";

  return (
    <div className="flex flex-col items-center">
      {VIEWPORT_MINI_TOOLS.map(tool => {
        const IconComponent = ICON_MAP[tool.icon];
        if (!IconComponent) return null;
        return (
          <div 
            key={tool.id}
            className={btnClass}
            onMouseDown={(e) => handleToolClick(e, tool)}
            title={tool.label + (tool.isPlaceholder ? " (Placeholder)" : "")}
          >
            <IconComponent />
          </div>
        );
      })}
    </div>
  );
}

