import React, { useEffect, useState } from 'react';
import { SidePanel, ErrorBoundary, LoadingIndicatorProgress } from '@ohif/ui';
import { ServicesManager, HangingProtocolService, CommandsManager } from '@ohif/core';
import { useAppConfig } from '@state';
// We can use the default Header, or create our own later. For now let's just use a simple div or the default ViewerHeader if we can import it.
// If we can't import ViewerHeader, we will just create a basic one.
// OHIF provides TopPanel components.

import CustomTopToolbar from './Components/CustomTopToolbar';
import CustomToolsSidebar from './Components/CustomToolsSidebar';
import MiniPacsSeriesRail from './Components/MiniPacsSeriesRail';

function MiniPacsViewerLayout({
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  viewports,
  ViewportGridComp,
  leftPanels = [],
  rightPanels = [],
  leftPanelDefaultClosed = false,
  rightPanelDefaultClosed = false,
}) {
  const [appConfig] = useAppConfig();
  const { hangingProtocolService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  useEffect(() => {
    document.body.classList.add('bg-black', 'overflow-hidden');
    return () => document.body.classList.remove('bg-black', 'overflow-hidden');
  }, []);

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => setShowLoadingIndicator(false)
    );
    return () => unsubscribe();
  }, [hangingProtocolService]);

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);
    if (!entry || !entry.component) {
      throw new Error(`Component not found for extension: ${id}`);
    }
    return { entry, content: entry.component };
  };

  const getPanelData = id => {
    const { content, entry } = getComponent(id);
    return { id: entry.id, iconName: entry.iconName, iconLabel: entry.iconLabel, label: entry.label, name: entry.name, content };
  };

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);
    return { component: entry.component, displaySetsToDisplay: viewportComponent.displaySetsToDisplay };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);

  // We need the SidePanelWithServices component. We can just use it from @ohif/extension-default if it's exported.
  // Actually, we can just render the components directly or use the underlying OHIF UI SidePanel.

  return (
    <div className="flex h-screen w-screen flex-col bg-black">
      {/* Header Area */}
      <div className="h-[52px] bg-[#102126] flex items-center px-4 border-b border-[#1A323A] gap-4">
        <h1 className="text-[#00B5B8] text-xl font-bold tracking-widest min-w-max">PACS VIEWER</h1>
        <div className="flex-1 border-l border-[#1A323A] pl-4 h-[36px]">
          <CustomTopToolbar servicesManager={servicesManager} />
        </div>
      </div>

      <div className="relative flex flex-1 flex-row flex-nowrap items-stretch overflow-hidden">
        {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-black" />}
        
        {/* CUSTOM LEFT PANEL 1: Tools Accordion */}
        <CustomToolsSidebar servicesManager={servicesManager} />

        {/* CUSTOM LEFT PANEL 2: Series Rail */}
        <MiniPacsSeriesRail
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          commandsManager={commandsManager}
        />

        {/* VIEWPORT GRID */}
        <div className="flex h-full flex-1 flex-col bg-black">
          <ErrorBoundary context="Grid">
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
              commandsManager={commandsManager}
            />
          </ErrorBoundary>
        </div>

      </div>
    </div>
  );
}

export default function getLayoutTemplateModule({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function MiniPacsLayoutWithServices(props) {
    return MiniPacsViewerLayout({
      servicesManager,
      extensionManager,
      commandsManager,
      hotkeysManager,
      ...props,
    });
  }

  return [
    {
      name: 'minipacsViewerLayout',
      id: 'minipacsViewerLayout',
      component: MiniPacsLayoutWithServices,
    },
  ];
}
