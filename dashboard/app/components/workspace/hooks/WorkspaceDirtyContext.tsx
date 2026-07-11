"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";

interface WorkspaceDirtyContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  pendingAction: (() => void) | null;
  interceptNavigation: (action: () => void) => boolean;
  resolvePendingAction: (proceed: boolean) => void;
  registerSaveCallback: (callback: (() => Promise<boolean>) | null) => void;
  executeSave: () => Promise<boolean>;
}

const WorkspaceDirtyContext = createContext<WorkspaceDirtyContextValue | null>(null);

export function WorkspaceDirtyProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const saveCallbackRef = useRef<(() => Promise<boolean>) | null>(null);

  // Hook into browser native unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Standard way to trigger browser's confirmation dialog
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const interceptNavigation = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingAction(() => action);
        return true; // Intercepted
      }
      action();
      return false; // Not intercepted
    },
    [isDirty]
  );

  const resolvePendingAction = useCallback(
    (proceed: boolean) => {
      const action = pendingAction;
      // Close the dialog before executing navigation. This also prevents a
      // double click from invoking the same action twice.
      setPendingAction(null);
      if (proceed && action) action();
    },
    [pendingAction]
  );
  const registerSaveCallback = useCallback((callback: (() => Promise<boolean>) | null) => {
    saveCallbackRef.current = callback;
  }, []);

  const executeSave = useCallback(async () => {
    if (saveCallbackRef.current) {
      return await saveCallbackRef.current();
    }
    return false;
  }, []);

  const value = useMemo(() => ({
    isDirty,
    setDirty,
    pendingAction,
    interceptNavigation,
    resolvePendingAction,
    registerSaveCallback,
    executeSave,
  }), [
    isDirty,
    setDirty,
    pendingAction,
    interceptNavigation,
    resolvePendingAction,
    registerSaveCallback,
    executeSave,
  ]);

  return (
    <WorkspaceDirtyContext.Provider
      value={value}
    >
      {children}
    </WorkspaceDirtyContext.Provider>
  );
}

export function useWorkspaceDirty() {
  const context = useContext(WorkspaceDirtyContext);
  if (!context) {
    throw new Error("useWorkspaceDirty must be used inside WorkspaceDirtyProvider");
  }
  return context;
}
