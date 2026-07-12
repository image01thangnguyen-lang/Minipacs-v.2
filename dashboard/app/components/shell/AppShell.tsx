"use client";

import React from "react";

export function AppShell({
  children,
  contentClassName = "",
  contentOverflow = "auto",
}: {
  children: React.ReactNode;
  contentClassName?: string;
  contentOverflow?: "hidden" | "auto";
}) {
  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-vin-root text-vin-text">
      <main className={`min-h-0 min-w-0 flex-1 ${contentOverflow === "auto" ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"} ${contentClassName}`}>
        {children}
      </main>
    </div>
  );
}
