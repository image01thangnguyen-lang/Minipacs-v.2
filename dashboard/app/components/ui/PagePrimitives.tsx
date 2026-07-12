import type { HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

function cx(...values: Array<string | undefined | false>) { return values.filter(Boolean).join(" "); }

export function PageCanvas({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("h-full min-h-0 w-full bg-vin-root font-sans text-vin-text", className)} {...props} />;
}

export function PagePanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cx("rounded-lg border border-vin-border bg-vin-panel shadow-sm", className)} {...props} />;
}

export function KpiCard({ label, value, tone = "default" }: { label: ReactNode; value: ReactNode; tone?: "default" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "border-l-vin-status-danger-bg" : tone === "warning" ? "border-l-vin-status-warning-bg" : "border-l-vin-accent";
  return <PagePanel className={cx("min-w-0 border-l-4 p-4", toneClass)}><div className="text-xs font-semibold uppercase tracking-wide text-vin-muted">{label}</div><div className="mt-1 truncate text-2xl font-bold text-vin-text">{value}</div></PagePanel>;
}

export function FormLabel({ className, ...props }: HTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("mb-1 block text-xs font-semibold text-vin-text2", className)} {...props} />;
}

export function FormInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("h-9 rounded border border-vin-border bg-vin-shell px-3 text-sm text-vin-text outline-none transition focus:border-vin-accent focus:ring-2 focus:ring-vin-accent/20", props.className)} />;
}

export function FormSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("h-9 rounded border border-vin-border bg-vin-shell px-3 text-sm text-vin-text outline-none transition focus:border-vin-accent focus:ring-2 focus:ring-vin-accent/20", props.className)} />;
}