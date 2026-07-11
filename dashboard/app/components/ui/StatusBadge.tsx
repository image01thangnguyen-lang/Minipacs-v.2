import React from "react";
import type { StatusBadgeProps } from "./shared-contracts";
import { resolveStatusBadge } from "../../../lib/ui/status-badge-registry";

/**
 * Domain-specific status registries.
 * Encapsulates the label mapping and visual token mapping (using semantic `--vin-*` tailwind classes).
 */

/**
 * StatusBadge Component
 * Uses a domain-based registry to render the correct semantic token and localization label.
 */
export function StatusBadge({ domain, status, label, size = "md", className = "" }: StatusBadgeProps) {
  const mapping = resolveStatusBadge(domain, status);
  const displayLabel = label ?? mapping.label;
  const baseClasses = "inline-flex items-center justify-center rounded-full border font-bold leading-none truncate";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px] max-w-[120px]";

  return (
    <span className={`${baseClasses} ${sizeClasses} ${mapping.className} ${className}`} title={displayLabel} data-domain={domain} data-status={status}>
      {displayLabel}
    </span>
  );
}
