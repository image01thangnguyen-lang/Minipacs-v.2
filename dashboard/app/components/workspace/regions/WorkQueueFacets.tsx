import React from "react";

export function WorkQueueFacets() {
  return (
    <section className="flex-1 overflow-auto border-b border-vin-border/70 p-3" aria-labelledby="work-queue-heading">
      <h3 id="work-queue-heading" className="mb-2 text-[10px] font-bold uppercase tracking-wider text-vin-muted">Work Queue</h3>
      <div className="text-[11px] text-vin-faint italic">Filters will appear here (Phase 4 PR1 Shell)</div>
    </section>
  );
}
