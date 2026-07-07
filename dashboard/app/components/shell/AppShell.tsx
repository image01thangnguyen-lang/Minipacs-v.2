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
    <div className={`flex h-screen w-full bg-vin-root ${contentOverflow === "auto" ? "overflow-auto" : "overflow-hidden"} ${contentClassName}`}>
      {children}
    </div>
  );
}
