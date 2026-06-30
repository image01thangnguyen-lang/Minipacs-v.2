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
import { MiniPacsCommandToast } from './Components/MiniPacsCommandToast';
import { MiniPacsHistoryPanel } from './Components/MiniPacsHistoryPanel';
import { MiniPacsSnapshotGallery } from './Components/MiniPacsSnapshotGallery';
import { MiniPacsKeyImageDialog } from './Components/MiniPacsKeyImageDialog';
import { MiniPacsReportWorkspaceDialog } from './Components/MiniPacsReportWorkspaceDialog';
import { viewerAuditService } from './services/viewerAuditService';
import { viewerContextService } from './services/viewerContextService';
import { viewerMeasurementPersistenceService } from './services/viewerMeasurementPersistenceService';
import { viewerHangingProtocolService } from './services/viewerHangingProtocolService';

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
  const { hangingProtocolService, viewportGridService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);

  useEffect(() => {
    document.body.classList.add('bg-black', 'overflow-hidden');
    
    // Add custom VRPACS active viewport styling
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .minipacs-layout-root .viewport-pane.active, 
      .minipacs-layout-root .border-primary-light.border-2 {
        border-color: #f59e0b !important; /* amber-500 */
        border-width: 2px !important;
        box-shadow: inset 0 0 0 1px #f59e0b, 0 0 8px rgba(245, 158, 11, 0.4) !important;
      }
      .minipacs-layout-root .group-hover\\:border-transparent.border-transparent {
        border-color: transparent !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.body.classList.remove('bg-black', 'overflow-hidden');
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => setShowLoadingIndicator(false)
    );
    return () => unsubscribe();
  }, [hangingProtocolService]);

  useEffect(() => {
    // We try to grab the study UID from the URL since the viewport might not be ready
    const urlParams = new URLSearchParams(window.location.search);
    const studyUids = urlParams.get('StudyInstanceUIDs');
    let firstUid = undefined;
    if (studyUids) {
      firstUid = studyUids.split(',')[0];
      viewerHangingProtocolService.initialize(servicesManager, commandsManager, extensionManager);
      viewerHangingProtocolService.runAutoLayoutWhenReady(firstUid);
      viewerContextService.loadContext(firstUid).catch(() => {});
      viewerMeasurementPersistenceService.loadForStudy(firstUid).catch(() => {});
    }

    // Audit viewer open with the extracted UID
    viewerAuditService.recordAction(firstUid, 'viewer_opened');
  }, []);

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
    <div className="minipacs-layout-root flex h-screen w-screen flex-col bg-black">
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

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <ErrorBoundary context="Grid">
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
              commandsManager={commandsManager}
            />
          </ErrorBoundary>
        </div>

        <MiniPacsCommandToast />
        
        {/* Custom Workflow Modals/Panels */}
        <MiniPacsHistoryPanel servicesManager={servicesManager} />
        <MiniPacsSnapshotGallery servicesManager={servicesManager} />
        <MiniPacsKeyImageDialog servicesManager={servicesManager} onClose={() => {}} />
        <MiniPacsReportWorkspaceDialog servicesManager={servicesManager} onClose={() => {}} />
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
