import React from "react";
import { SplitPane } from "../ui/SplitPane";


interface DoctorWorkspaceProps {
  switcher: React.ReactNode;
  searchBar: React.ReactNode;
  facets: React.ReactNode;
  scopeTree: React.ReactNode;
  grid: React.ReactNode;
  relatedPanel: React.ReactNode;
  contextPanel: React.ReactNode;
  /** Optional report panel (Region 7). Rendered in the right column below context panel. */
  reportPanel?: React.ReactNode;
  layoutPrefs?: { leftWidth?: number; rightWidth?: number; relatedHeight?: number; leftCollapsed?: boolean };
  onLayoutChange?: (updates: { leftWidth?: number; rightWidth?: number; relatedHeight?: number; leftCollapsed?: boolean }) => void;
}

export function DoctorWorkspace({
  switcher,
  searchBar,
  facets,
  scopeTree,
  grid,
  relatedPanel,
  contextPanel,
  reportPanel,
  layoutPrefs,
  onLayoutChange,
}: DoctorWorkspaceProps) {
  return (
    <main className="h-full min-h-0 w-full overflow-auto bg-vin-root font-sans text-vin-text" aria-label="Doctor workspace">
      <div 
        className="doctor-workspace-grid h-full min-h-[640px] min-w-[1180px] w-full"
        style={layoutPrefs ? {
          ...(layoutPrefs.leftWidth !== undefined && { "--workspace-left-width": `${layoutPrefs.leftWidth}px` }),
          ...(layoutPrefs.rightWidth !== undefined && { "--workspace-right-width": `${layoutPrefs.rightWidth}px` }),
          ...(layoutPrefs.relatedHeight !== undefined && { "--workspace-related-height": `${layoutPrefs.relatedHeight}px` }),
        } as React.CSSProperties : undefined}
      >
        {/* Left Column */}
        <aside
          aria-label="Workspace navigation and filters"
          className="flex h-full flex-col border-r border-vin-border bg-vin-shell"
          style={{ gridColumn: "1 / 2", gridRow: "1 / 4" }}
        >
          {switcher}
          {searchBar}
          <div className="flex flex-1 flex-col overflow-hidden">
            {facets}
            {scopeTree}
          </div>
        </aside>

        {/* Vertical Splitter (Left - Center) */}
        <div style={{ gridColumn: "2 / 3", gridRow: "1 / 4" }}>
          <SplitPane
            orientation="vertical"
            cssVariable="--workspace-left-width"
            minSize={260}
            maxSize={480}
            defaultSize={320}
            label="Resize workspace filters"
            onResizeEnd={(newSize) => onLayoutChange?.({ leftWidth: newSize })}
          />
        </div>

        {/* Center Column: Grid (Top) */}
        <section
          aria-label="Study worklist"
          className="flex min-h-0 flex-col overflow-hidden bg-vin-panel"
          style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}
        >
          {grid}
        </section>

        {/* Horizontal Splitter (Center Top - Center Bottom) */}
        <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }}>
          <SplitPane
            orientation="horizontal"
            cssVariable="--workspace-related-height"
            minSize={150}
            maxSize={600}
            defaultSize={250}
            reverse={true} // Moving up increases the height (since height is from bottom)
            label="Resize related studies panel"
            onResizeEnd={(newSize) => onLayoutChange?.({ relatedHeight: newSize })}
          />
        </div>

        {/* Center Column: Related Studies (Bottom) */}
        <section
          aria-label="Related studies"
          className="flex min-h-0 flex-col overflow-hidden border-t border-vin-border bg-vin-sidebar"
          style={{ gridColumn: "3 / 4", gridRow: "3 / 4" }}
        >
          {relatedPanel}
        </section>

        {/* Vertical Splitter (Center - Right) */}
        <div style={{ gridColumn: "4 / 5", gridRow: "1 / 4" }}>
          <SplitPane
            orientation="vertical"
            cssVariable="--workspace-right-width"
            minSize={300}
            maxSize={600}
            defaultSize={450}
            reverse={true} // Moving left increases the right width
            label="Resize patient and study context"
            onResizeEnd={(newSize) => onLayoutChange?.({ rightWidth: newSize })}
          />
        </div>

        {/* Right Column: Context Panel + optional Report Panel */}
        <aside
          aria-label="Patient and study context"
          className="flex h-full flex-col border-l border-vin-border bg-vin-panel"
          style={{ gridColumn: "5 / 6", gridRow: "1 / 4" }}
        >
          <div className={reportPanel ? "flex-none" : "flex-1"}>
            {contextPanel}
          </div>
          {reportPanel && (
            <div className="flex-1 min-h-0 overflow-hidden border-t border-vin-border">
              {reportPanel}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
