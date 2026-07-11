"use client";

import React, { useRef, KeyboardEvent, useEffect, useCallback } from "react";

interface SplitPaneProps {
  orientation: "horizontal" | "vertical";
  cssVariable: string;
  minSize: number;
  maxSize: number;
  defaultSize: number;
  reverse?: boolean;
  label: string;
  onResizeEnd?: (newSize: number) => void;
}

export function SplitPane({
  orientation,
  cssVariable,
  minSize,
  maxSize,
  defaultSize,
  reverse = false,
  label,
  onResizeEnd,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const getVariableTarget = useCallback(() =>
    containerRef.current?.closest<HTMLElement>(".doctor-workspace-grid") ?? null, []);

  const readSize = useCallback(() => {
    const target = getVariableTarget();
    if (!target) return defaultSize;
    const parsed = Number.parseFloat(getComputedStyle(target).getPropertyValue(cssVariable));
    return Number.isFinite(parsed) ? parsed : defaultSize;
  }, [cssVariable, defaultSize, getVariableTarget]);

  const updateSize = useCallback((newSize: number) => {
    const target = getVariableTarget();
    if (!target || !Number.isFinite(newSize)) return;
    const clamped = Math.max(minSize, Math.min(newSize, maxSize));
    target.style.setProperty(cssVariable, `${clamped}px`);
    containerRef.current?.setAttribute("aria-valuenow", clamped.toString());
  }, [cssVariable, getVariableTarget, maxSize, minSize]);

  useEffect(() => {
    updateSize(readSize());
    return () => dragCleanupRef.current?.();
  }, [readSize, updateSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button (left click) or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    
    e.preventDefault();
    const startPos = orientation === "vertical" ? e.clientX : e.clientY;
    
    const currentSize = readSize();

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentPos = orientation === "vertical" ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - startPos;
      
      const newSize = reverse ? currentSize - delta : currentSize + delta;
      updateSize(newSize);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      dragCleanupRef.current = null;
      onResizeEnd?.(readSize());
    };

    dragCleanupRef.current?.();
    dragCleanupRef.current = cleanup;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
    
    document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const step = 20;
    let delta = 0;

    if (orientation === "vertical") {
      if (e.key === "ArrowLeft") delta = reverse ? step : -step;
      if (e.key === "ArrowRight") delta = reverse ? -step : step;
    } else {
      if (e.key === "ArrowUp") delta = reverse ? step : -step;
      if (e.key === "ArrowDown") delta = reverse ? -step : step;
    }

    if (e.key === "Home") {
      e.preventDefault();
      updateSize(minSize);
      onResizeEnd?.(minSize);
      return;
    }
    
    if (e.key === "End") {
      e.preventDefault();
      updateSize(maxSize);
      onResizeEnd?.(maxSize);
      return;
    }

    if (delta !== 0) {
      e.preventDefault();
      const newSize = readSize() + delta;
      updateSize(newSize);
      onResizeEnd?.(Math.max(minSize, Math.min(newSize, maxSize)));
    }
  };

  return (
    <div
      ref={containerRef}
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      aria-valuenow={defaultSize}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      tabIndex={0}
      className={orientation === "vertical" ? "workspace-splitter-vertical" : "workspace-splitter-horizontal"}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      title={`${label}: kéo hoặc dùng phím mũi tên để đổi kích thước`}
    />
  );
}
