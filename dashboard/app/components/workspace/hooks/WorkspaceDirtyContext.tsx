"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

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
      if (proceed && pendingAction) {
        pendingAction();
      }
      setPendingAction(null);
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

  return (
    <WorkspaceDirtyContext.Provider
      value={{
        isDirty,
        setDirty,
        pendingAction,
        interceptNavigation,
        resolvePendingAction,
        registerSaveCallback,
        executeSave,
      }}
    >
      {children}
    </WorkspaceDirtyContext.Provider>
  );
}

export function useWorkspaceDirty() {
  return useContext(WorkspaceDirtyContext);
}
