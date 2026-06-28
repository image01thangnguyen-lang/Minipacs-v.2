import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useViewportGrid } from '@ohif/ui';
import { mapDisplaySetsToMiniPacsSeries } from '../services/seriesAdapter';
import { routeDisplaySetToActiveViewport } from '../services/viewportRouting';
import { MiniPacsSeriesItem } from '../types/series';
import MiniPacsSeriesThumbnail from './MiniPacsSeriesThumbnail';
import MiniPacsSeriesContextMenu from './MiniPacsSeriesContextMenu';

// Helper to load thumbnail from OHIF Cornerstone
function getImageSrcFromImageId(cornerstone: any, imageId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    cornerstone.utilities
      .loadImageToCanvas({ canvas, imageId })
      .then(() => {
        resolve(canvas.toDataURL());
      })
      .catch(reject);
  });
}

interface MiniPacsSeriesRailProps {
  servicesManager: any;
  extensionManager: any;
  commandsManager: any;
}

const MiniPacsSeriesRail: React.FC<MiniPacsSeriesRailProps> = ({
  servicesManager,
  extensionManager,
  commandsManager,
}) => {
  const { displaySetService } = servicesManager.services;
  const [{ activeViewportId, viewports }] = useViewportGrid();

  const [seriesItems, setSeriesItems] = useState<MiniPacsSeriesItem[]>([]);
  const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    displaySetInstanceUID: string;
  } | null>(null);

  // Stable references — computed once, not every render [P1 fix]
  const dataSource = useMemo(
    () => extensionManager.getDataSources()[0],
    [extensionManager]
  );

  const getImageSrc = useMemo(() => {
    const utilities = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.utilityModule.common'
    );
    if (utilities?.exports?.getCornerstoneLibraries) {
      const { cornerstone } = utilities.exports.getCornerstoneLibraries();
      return (imageId: string) => getImageSrcFromImageId(cornerstone, imageId);
    }
    return () => Promise.reject('Cornerstone not available');
  }, [extensionManager]);

  // Use a ref for thumbnailImageSrcMap to avoid dependency loops [P1 fix]
  const thumbnailMapRef = useRef(thumbnailImageSrcMap);
  thumbnailMapRef.current = thumbnailImageSrcMap;

  // Re-map display sets — only update state when the mapped result actually changed
  const updateSeriesItems = useCallback(
    (markLoaded = false) => {
      const rawDisplaySets = displaySetService.getActiveDisplaySets();
      const mapped = mapDisplaySetsToMiniPacsSeries(rawDisplaySets, thumbnailMapRef.current);
      setSeriesItems(prev => {
        // Deep-enough compare: skip update if all visible fields are identical
        if (
          prev.length === mapped.length &&
          prev.every(
            (item, i) =>
              item.displaySetInstanceUID === mapped[i].displaySetInstanceUID &&
              item.thumbnailSrc === mapped[i].thumbnailSrc &&
              item.sortKey === mapped[i].sortKey &&
              item.SeriesDescription === mapped[i].SeriesDescription &&
              item.SeriesNumber === mapped[i].SeriesNumber &&
              item.Modality === mapped[i].Modality &&
              item.numInstances === mapped[i].numInstances
          )
        ) {
          return prev;
        }
        return mapped;
      });
      // Only mark loaded when explicitly told (after DISPLAY_SETS_ADDED or
      // when initial active sets are non-empty) to avoid premature "No image series"
      if (markLoaded) {
        setIsLoaded(true);
      }
    },
    [displaySetService]
  );

  // Load thumbnails for a batch of display sets — uses refs to avoid stale deps [P1 fix]
  const loadThumbnails = useCallback(
    async (displaySets: any[]) => {
      const currentMap = thumbnailMapRef.current;
      const toFetch = displaySets.filter(
        ds =>
          !ds.unsupported &&
          !ds.excludeFromThumbnailBrowser &&
          !currentMap[ds.displaySetInstanceUID]
      );

      if (toFetch.length === 0) return;

      const newEntries: Record<string, string> = {};
      for (const ds of toFetch) {
        try {
          const imageIds = dataSource.getImageIdsForDisplaySet(ds) || [];
          const imageId = imageIds[Math.floor(imageIds.length / 2)];
          if (imageId) {
            newEntries[ds.displaySetInstanceUID] = await getImageSrc(imageId);
          }
        } catch (err) {
          console.warn(
            `[MiniPACS] Failed to fetch thumbnail for ${ds.displaySetInstanceUID}`,
            err
          );
        }
      }

      if (Object.keys(newEntries).length > 0) {
        setThumbnailImageSrcMap(prev => ({ ...prev, ...newEntries }));
      }
    },
    [dataSource, getImageSrc]
  );

  // When thumbnail map changes, re-derive series items
  useEffect(() => {
    updateSeriesItems();
  }, [thumbnailImageSrcMap, updateSeriesItems]);

  // Initial load
  useEffect(() => {
    const activeSets = displaySetService.getActiveDisplaySets();
    if (activeSets.length > 0) {
      loadThumbnails(activeSets);
      updateSeriesItems(true); // mark loaded — we already have display sets
    }
  }, [displaySetService]); // intentionally stable deps only — runs once

  // Subscriptions
  useEffect(() => {
    const subAdded = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      (data: any) => {
        loadThumbnails(data.displaySetsAdded);
        updateSeriesItems(true); // mark loaded — display sets have arrived
      }
    );

    const subChanged = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      () => {
        updateSeriesItems(true); // mark loaded — service has finished processing
      }
    );

    const subInvalidated = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      () => {
        updateSeriesItems();
      }
    );

    return () => {
      subAdded.unsubscribe();
      subChanged.unsubscribe();
      subInvalidated.unsubscribe();
    };
  }, [displaySetService, loadThumbnails, updateSeriesItems]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  const activeDisplaySetInstanceUIDs =
    viewports.get(activeViewportId)?.displaySetInstanceUIDs || [];

  // [P1 fix] Use routeDisplaySetToActiveViewport — it has its own fallback logic
  const handleSeriesClick = useCallback(
    (displaySetInstanceUID: string) => {
      routeDisplaySetToActiveViewport({
        servicesManager,
        displaySetInstanceUID,
      });
    },
    [servicesManager]
  );

  const handleSeriesDoubleClick = useCallback(
    (displaySetInstanceUID: string) => {
      routeDisplaySetToActiveViewport({
        servicesManager,
        displaySetInstanceUID,
      });
      // Double click routes normally for Phase 4; do not alter layout.
    },
    [servicesManager]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, displaySetInstanceUID: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, displaySetInstanceUID });
    },
    []
  );

  // [P3 fix] Distinguish "loading" vs "no series"
  const emptyLabel = isLoaded ? 'No image series' : 'Loading series...';

  return (
    <div className="flex h-full w-[120px] flex-col border-r border-[#1A323A] bg-[#0E1B1F]">
      <div className="flex items-center justify-between border-b border-[#1A323A] px-2 py-[6px] text-[#A0B0B5]">
        <span className="text-[12px] font-semibold tracking-wider">SERIES</span>
        <span className="text-[10px]">{seriesItems.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 hide-scrollbar">
        {seriesItems.length === 0 ? (
          <div className="mt-4 text-center text-[11px] text-[#A0B0B5]">{emptyLabel}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {seriesItems.map(series => (
              <MiniPacsSeriesThumbnail
                key={series.displaySetInstanceUID}
                series={series}
                isActive={activeDisplaySetInstanceUIDs.includes(
                  series.displaySetInstanceUID
                )}
                onClick={() => handleSeriesClick(series.displaySetInstanceUID)}
                onDoubleClick={() =>
                  handleSeriesDoubleClick(series.displaySetInstanceUID)
                }
                onContextMenu={e =>
                  handleContextMenu(e, series.displaySetInstanceUID)
                }
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <MiniPacsSeriesContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: #1A323A;
          border-radius: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3A606E;
        }
      `}</style>
    </div>
  );
};

export default MiniPacsSeriesRail;
