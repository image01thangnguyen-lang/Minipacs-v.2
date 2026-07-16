import React from "react";

type Option = { value: string; label: string; count?: number };
export function WorkQueueFacets({ status, modality, statuses, modalities, onStatusChange, onModalityChange, onClear }: {
  status: string; modality: string; statuses: Option[]; modalities: Option[];
  onStatusChange: (value: string) => void; onModalityChange: (value: string) => void; onClear: () => void;
}) {
  const active = status !== "ALL" || modality !== "ALL";
  return (
    <section className="max-h-[42%] overflow-auto border-b border-vin-border/70 p-3" aria-labelledby="work-queue-heading">
      <div className="mb-2 flex items-center justify-between"><h3 id="work-queue-heading" className="text-sm font-bold uppercase tracking-wider text-vin-muted">Hàng đợi</h3>
        {active && <button onClick={onClear} className="text-sm text-vin-accent hover:underline">Xóa lọc</button>}</div>
      <fieldset className="mb-3"><legend className="mb-1 text-sm font-semibold text-vin-faint">Trạng thái</legend>
        <div className="space-y-0.5">{statuses.map(o => <button type="button" key={o.value} onClick={() => onStatusChange(o.value)} aria-pressed={status === o.value} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${status === o.value ? "bg-vin-accent/15 text-vin-accent" : "text-vin-text2 hover:bg-white/5"}`}><span>{o.label}</span>{o.count !== undefined && <span className="rounded bg-vin-root px-1.5 font-mono text-sm text-vin-muted">{o.count}</span>}</button>)}</div>
      </fieldset>
      <fieldset><legend className="mb-1 text-sm font-semibold text-vin-faint">Phương thức</legend>
        <div className="flex flex-wrap gap-1">{modalities.map(o => <button type="button" key={o.value} onClick={() => onModalityChange(o.value)} aria-pressed={modality === o.value} className={`rounded border px-2 py-1 text-sm ${modality === o.value ? "border-vin-accent bg-vin-accent/15 text-vin-accent" : "border-vin-border text-vin-muted hover:text-white"}`}>{o.label}</button>)}</div>
      </fieldset>
    </section>
  );
}
