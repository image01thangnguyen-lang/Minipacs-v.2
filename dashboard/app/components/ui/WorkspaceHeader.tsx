import React from "react";
import { WorkspaceHeaderProps } from "./shared-contracts";

/**
 * WorkspaceHeader Component
 * A consistent header for standard workspaces and admin pages.
 */
export function WorkspaceHeader({ title, subtitle, extraContent, headingLevel = 1, className = "" }: WorkspaceHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <header className={`flex flex-col justify-between border-b border-vin-border bg-vin-panel p-4 md:flex-row md:items-center ${className}`}>
      <div className="flex flex-col">
        <Heading className="text-xl font-semibold text-vin-text tracking-tight">
          {title}
        </Heading>
        {subtitle && (
          <div className="text-sm text-vin-muted mt-0.5">
            {subtitle}
          </div>
        )}
      </div>

      {extraContent && (
        <div className="mt-3 md:mt-0 flex items-center gap-3">
          {extraContent}
        </div>
      )}
    </header>
  );
}
