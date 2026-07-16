import React from "react";

export function FacilityScopeTree({ facilities, value, onChange }: { facilities: { id: string; name: string; count: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <section className="flex-1 overflow-auto p-3" aria-labelledby="facility-scope-heading">
      <h3 id="facility-scope-heading" className="mb-2 text-sm font-bold uppercase tracking-wider text-vin-muted">Phạm vi cơ sở</h3>
      <div role="tree" aria-label="Cây cơ sở" className="space-y-0.5">
        <button role="treeitem" aria-selected={value === "ALL"} onClick={() => onChange("ALL")} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${value === "ALL" ? "bg-vin-accent/15 text-vin-accent" : "text-vin-text2 hover:bg-white/5"}`}><span>▾ Tất cả cơ sở được phép</span><span>{facilities.reduce((n, f) => n + f.count, 0)}</span></button>
        {facilities.map(f => <button role="treeitem" aria-level={2} aria-selected={value === f.id} key={f.id} onClick={() => onChange(f.id)} className={`flex w-full items-center justify-between rounded py-1.5 pl-6 pr-2 text-left text-sm ${value === f.id ? "bg-vin-accent/15 text-vin-accent" : "text-vin-muted hover:bg-white/5 hover:text-white"}`}><span className="truncate">└ {f.name}</span><span className="ml-2 font-mono text-sm">{f.count}</span></button>)}
        {!facilities.length && <p className="px-2 py-3 text-sm italic text-vin-faint">Không có dữ liệu cơ sở trong danh sách hiện tại.</p>}
      </div>
    </section>
  );
}
