import React, { useState, useRef, useEffect } from 'react';
import { viewportWorkflowActions } from '../config/viewportWorkflowActions';
import { runMiniPacsTool } from '../services/commandBridge';

// Simple SVGs since we don't have lucide-react here
const Icons = {
  MoreVertical: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
  ),
};

export const MiniPacsViewportOverflowMenu = ({ servicesManager, viewportId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (e, tool) => {
    e.stopPropagation();
    
    // 1. Set this viewport as active before running command
    const { viewportGridService } = servicesManager.services;
    viewportGridService.setActiveViewportId(viewportId);

    // 2. Run command
    runMiniPacsTool(servicesManager, tool, { viewportId });
    setIsOpen(false);
  };

  const btnClass = "w-8 h-8 flex items-center justify-center text-[#00B5B8] hover:bg-[#00B5B8]/20 hover:text-white rounded transition-colors bg-[#102126]/80 backdrop-blur-sm border border-[#00B5B8]/30 mb-1 cursor-pointer";

  return (
    <div className="relative" ref={menuRef}>
      <div 
        className={btnClass}
        onMouseDown={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        title="More Actions"
      >
        <Icons.MoreVertical />
      </div>

      {isOpen && (
        <div className="absolute right-full top-0 mr-2 w-48 bg-[#102126] border border-[#00B5B8]/30 rounded shadow-lg overflow-hidden z-50">
          {viewportWorkflowActions.filter(t => t.placement.includes('viewport-toolbar')).map(action => {
            const isDisabled = action.status === 'backend' || action.status === 'guarded';
            return (
              <div
                key={action.id}
                onMouseDown={isDisabled ? undefined : (e) => handleAction(e, action)}
                className={`px-4 py-2 text-sm transition-colors ${
                  isDisabled 
                    ? 'text-gray-500 cursor-not-allowed bg-transparent' 
                    : 'text-[#00B5B8] hover:bg-[#00B5B8]/20 hover:text-white cursor-pointer'
                }`}
                title={isDisabled ? (action.status === 'guarded' ? 'Locked' : 'Requires Backend API') : action.label}
              >
                {action.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
