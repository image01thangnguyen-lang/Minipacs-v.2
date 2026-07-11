import { useState, useEffect, useRef, useCallback } from "react";
import { autosaveReportAction, type AutosaveInput } from "@/app/actions/autosave-actions";

function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

export type AutosaveStatus = "IDLE" | "SAVING" | "SAVED" | "ERROR" | "STALE";

interface UseAutosaveProps {
  studyUid: string | null;
  editorState: AutosaveInput;
  initialRevision: number | null;
  enabled: boolean;
  debounceMs?: number;
}

export function useAutosave({
  studyUid,
  editorState,
  initialRevision,
  enabled,
  debounceMs = 1500,
}: UseAutosaveProps) {
  const [status, setStatus] = useState<AutosaveStatus>("IDLE");
  const [currentRevision, setCurrentRevision] = useState<number>(initialRevision || 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial revision when it loads
  useEffect(() => {
    if (initialRevision !== null) {
      setCurrentRevision(initialRevision);
    }
  }, [initialRevision]);

  // Debounce the state
  const [debouncedState] = useDebounce(editorState, debounceMs);
  
  // Track previous to detect actual changes
  const prevSavedStateRef = useRef<AutosaveInput>(editorState);
  
  // Prevent outdated requests from overwriting newer local state or status
  const sequenceRef = useRef(0);

  // Invalidate a request belonging to the previously selected study.
  useEffect(() => {
    sequenceRef.current += 1;
    setStatus("IDLE");
    setErrorMessage(null);
  }, [studyUid]);

  const save = useCallback(
    async (stateToSave: AutosaveInput, baseRev: number) => {
      if (!studyUid || !enabled) return;
      if (status === "STALE") return; // Halt if stale

      const seq = ++sequenceRef.current;
      setStatus("SAVING");
      setErrorMessage(null);

      try {
        const res = await autosaveReportAction(studyUid, baseRev, stateToSave);
        
        // Ignore if a newer request was dispatched
        if (seq !== sequenceRef.current) return;

        if (res.success) {
          setStatus("SAVED");
          setCurrentRevision(res.newRevision);
          prevSavedStateRef.current = stateToSave;
        } else {
          const errRes = res as Extract<typeof res, { success: false }>;
          if (errRes.code === "STALE_REVISION") {
            setStatus("STALE");
            setErrorMessage(errRes.error);
          } else {
            setStatus("ERROR");
            setErrorMessage(errRes.error);
          }
        }
      } catch (err: any) {
        if (seq !== sequenceRef.current) return;
        setStatus("ERROR");
        setErrorMessage("Lỗi kết nối khi lưu nháp.");
      }
    },
    [studyUid, enabled, status]
  );

  useEffect(() => {
    if (!enabled || status === "SAVING" || status === "STALE") return;

    const hasChanged =
      debouncedState.findings !== prevSavedStateRef.current.findings ||
      debouncedState.conclusion !== prevSavedStateRef.current.conclusion ||
      debouncedState.recommendation !== prevSavedStateRef.current.recommendation;

    if (hasChanged) {
      save(debouncedState, currentRevision);
    }
  }, [debouncedState, enabled, currentRevision, save, status]);

  // Reset status to IDLE if the user starts typing again after an ERROR or SAVED state
  // (Do not reset if STALE, user must reload)
  useEffect(() => {
    if (status === "STALE") return;
    
    const hasUnsavedChanges =
      editorState.findings !== prevSavedStateRef.current.findings ||
      editorState.conclusion !== prevSavedStateRef.current.conclusion ||
      editorState.recommendation !== prevSavedStateRef.current.recommendation;
      
    if (hasUnsavedChanges && status !== "SAVING" && status !== "IDLE") {
      setStatus("IDLE");
      setErrorMessage(null);
    }
  }, [editorState, status]);

  const isDirty = status === "SAVING" || (
    editorState.findings !== prevSavedStateRef.current.findings ||
    editorState.conclusion !== prevSavedStateRef.current.conclusion ||
    editorState.recommendation !== prevSavedStateRef.current.recommendation
  );

  return {
    autosaveStatus: status,
    autosaveError: errorMessage,
    currentRevision,
    isDirty,
    // Provide a way to manually sync state if an explicit save occurs outside this hook
    syncSavedState: (state: AutosaveInput, newRev: number) => {
      // Manual save wins over any autosave response already in flight.
      sequenceRef.current += 1;
      prevSavedStateRef.current = state;
      setCurrentRevision(newRev);
      setStatus("SAVED");
      setErrorMessage(null);
    }
  };
}
