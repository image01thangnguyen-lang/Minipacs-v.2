"use client";

import React from "react";
import { AppNavigationSidebar } from "../navigation/AppNavigationSidebar";

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
    <div className="flex h-screen w-full overflow-hidden bg-vin-root">
      <AppNavigationSidebar />
      <main 
        className={`flex-1 min-w-0 min-h-0 ${contentOverflow === "auto" ? "overflow-auto" : "overflow-hidden"} ${contentClassName}`}
      >
        {children}
      </main>
    </div>
  );
}
