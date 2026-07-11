"use client";

import React from "react";
import { FilterBarProps } from "./shared-contracts";
import { Search, X } from "lucide-react";

/**
 * FilterBar Component
 * Controlled filter bar that takes search inputs, domains facets, and actions.
 * Acts as a UI Primitive for all workspaces and admin tables.
 */
export function FilterBar({
  searchValue = "",
  onSearchChange,
  onReset,
  searchPlaceholder = "Tìm kiếm...",
  searchLabel = "Tìm kiếm",
  facets,
  datePreset,
  actions,
  className = "",
}: FilterBarProps) {
  const handleReset = () => {
    onReset?.();
  };

  return (
    <div role="search" className={`flex flex-col gap-3 border-b border-vin-border bg-vin-panel p-3 md:flex-row md:items-center ${className}`}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-vin-muted" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-md border border-vin-border bg-vin-root py-1.5 pl-9 pr-8 text-sm text-vin-text placeholder:text-vin-muted focus:border-vin-accent focus:outline-none focus:ring-1 focus:ring-vin-accent"
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-vin-muted hover:text-vin-text"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Date Preset */}
      {datePreset && (
        <div className="flex-shrink-0">
          {datePreset}
        </div>
      )}

      {/* Facets / Selects */}
      {facets && (
        <div className="flex flex-wrap items-center gap-2">
          {facets}
        </div>
      )}

      {/* Spacer to push actions to the right */}
      <div className="flex-1" />

      {/* Action Buttons & Reset */}
      <div className="flex items-center gap-2">
        {onReset && (
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-vin-muted hover:text-vin-text underline decoration-vin-border underline-offset-4 mr-2"
            aria-label="Đặt lại bộ lọc về mặc định"
          >
            Mặc định
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
