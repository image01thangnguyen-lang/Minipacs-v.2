import React from 'react';
import { VIEWPORT_MINI_TOOLS } from '../config/viewportMiniTools';
import { runMiniPacsTool } from '../services/commandBridge';
import { MiniPacsViewportOverflowMenu } from './MiniPacsViewportOverflowMenu';
import { ServicesManager } from '@ohif/core';

// Provide basic inline SVG icons to avoid missing lucide-react dependencies
const Icons = {
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Maximize: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
  MoreVertical: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>,
  MousePointer: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>,
};

interface MiniPacsViewportMiniToolbarProps {
  viewportId: string;
  servicesManager: ServicesManager;
}

export default function MiniPacsViewportMiniToolbar({ viewportId, servicesManager }: MiniPacsViewportMiniToolbarProps) {
  const { viewportGridService, toolbarService } = servicesManager.services;
  const [toggledTools, setToggledTools] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const subscription = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      (state: any) => {
        setToggledTools({ ...state.toggles });
      }
    );
    // Initial state
    setToggledTools({ ...toolbarService.state.toggles });
    return () => subscription.unsubscribe();
  }, [toolbarService]);

  const handleToolClick = (e: React.MouseEvent, toolConfig: any) => {
    e.stopPropagation();
    
    // 1. Set this viewport as active
    viewportGridService.setActiveViewportId(viewportId);

    // Toggle logic for sync
    let nextToggledState = undefined;
    if (toolConfig.action === 'sync') {
      nextToggledState = !toggledTools['StackImageSync'];
      // Note: we no longer manually setToggledTools here, it will update via event
    }

    if (toolConfig.isPlaceholder) {
      console.log(`[MiniToolbar] ${toolConfig.action} clicked for viewport ${viewportId}. This is a Phase 5 placeholder.`);
      return;
    }

    // 2. Dispatch action
    runMiniPacsTool(servicesManager, {
      id: toolConfig.id,
      label: toolConfig.label,
      icon: toolConfig.icon,
      type: toolConfig.action === 'windowLevel' ? 'tool' : toolConfig.action === 'sync' ? 'toggle' : 'action',
      status: 'ready',
      commandOptions: { toolName: toolConfig.toolName || toolConfig.id },
      commandName: toolConfig.action === 'fullscreen' ? 'toggleFullscreen' :
                   toolConfig.action === 'snapshot' ? 'showDownloadViewportModal' :
                   toolConfig.action === 'sync' ? 'toggleSync' : undefined
    }, { viewportId, toggledState: nextToggledState });
  };

  const btnClass = "w-8 h-8 flex items-center justify-center text-[#00B5B8] hover:bg-[#00B5B8]/20 hover:text-white rounded transition-colors bg-[#102126]/80 backdrop-blur-sm border border-[#00B5B8]/30 mb-1 cursor-pointer";

  return (
    <div className="flex flex-col items-center pointer-events-auto select-none">
      {VIEWPORT_MINI_TOOLS.map(tool => {
        if (tool.action === 'overflow') {
          return <MiniPacsViewportOverflowMenu key={tool.id} servicesManager={servicesManager} viewportId={viewportId} />;
        }

        const IconComponent = (Icons as any)[tool.icon] || Icons.Sun;
        const effectiveId = tool.action === 'sync' ? 'StackImageSync' : tool.id;
        const isToggled = toggledTools[effectiveId];
        const dynamicBtnClass = `${btnClass} ${isToggled ? 'bg-[#00B5B8]/20 text-white border-[#00B5B8]' : ''}`;

        return (
          <div 
            key={tool.id}
            className={dynamicBtnClass}
            onMouseDown={(e) => handleToolClick(e, tool)}
            title={tool.label + (tool.isPlaceholder ? " (Placeholder)" : "")}
          >
            <div className="relative">
              <Icons.MousePointer />
              <div className="absolute -bottom-2 -right-2 scale-50">
                <IconComponent />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
