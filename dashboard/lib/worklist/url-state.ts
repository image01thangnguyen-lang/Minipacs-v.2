import { z } from "zod";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { WorklistQueryRequest, WorklistQueryRequestSchema } from "./contract";

export const DatePresetSchema = z.enum(["TODAY", "YESTERDAY", "3DAYS", "7DAYS", "ALL"]);
export type DatePreset = z.infer<typeof DatePresetSchema>;

export const WorklistUrlStateSchema = z.object({
  q: z.string().trim().max(200).optional(),
  datePreset: DatePresetSchema.default("TODAY"),
  modality: z.string().trim().min(1).max(128).default("ALL"),
  workflowStatus: z.string().trim().min(1).max(128).default("ALL"),
  stationAe: z.string().trim().min(1).max(128).default("ALL"),
  assignedDoctor: z.string().trim().min(1).max(128).default("ALL"),
  hisStatus: z.string().trim().min(1).max(128).default("ALL"),
}).strict();

export type WorklistUrlState = z.infer<typeof WorklistUrlStateSchema>;

export const DEFAULT_URL_STATE: WorklistUrlState = {
  q: "",
  datePreset: "TODAY",
  modality: "ALL",
  workflowStatus: "ALL",
  stationAe: "ALL",
  assignedDoctor: "ALL",
  hisStatus: "ALL",
};

/**
 * Utility to accurately find the UTC offset for a given Date in a specific timezone
 */
function getOffsetMs(timezone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getP = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  const hour = getP("hour");
  const wallDate = new Date(
    Date.UTC(
      getP("year"),
      getP("month") - 1,
      getP("day"),
      hour === 24 ? 0 : hour,
      getP("minute"),
      getP("second"),
      date.getMilliseconds()
    )
  );
  return wallDate.getTime() - date.getTime();
}

/**
 * Resolve a relative date preset into absolute ISO string boundaries in the given timezone
 */
export function resolveDatePreset(
  preset: DatePreset,
  timezone: string = "Asia/Ho_Chi_Minh",
  now: Date = new Date()
) {
  // Validate eagerly so callers receive a predictable error for forged zones.
  new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(now);
  const offsetMs = getOffsetMs(timezone, now);
  const wallNow = new Date(now.getTime() + offsetMs);

  const getBoundary = (daysOffset: number) => {
    // Create midnight wall-time for the target date
    const boundaryWall = new Date(
      Date.UTC(wallNow.getUTCFullYear(), wallNow.getUTCMonth(), wallNow.getUTCDate() + daysOffset, 0, 0, 0, 0)
    );
    // Find the offset at that exact moment to handle DST correctly
    const approxRealDate = new Date(boundaryWall.getTime() - offsetMs);
    const realOffsetMs = getOffsetMs(timezone, approxRealDate);
    return new Date(boundaryWall.getTime() - realOffsetMs);
  };

  let fromDate: Date;
  let toDate: Date;

  if (preset === "TODAY") {
    fromDate = getBoundary(0);
    toDate = getBoundary(1);
  } else if (preset === "YESTERDAY") {
    fromDate = getBoundary(-1);
    toDate = getBoundary(0);
  } else if (preset === "3DAYS") {
    fromDate = getBoundary(-2);
    toDate = getBoundary(1);
  } else if (preset === "7DAYS") {
    fromDate = getBoundary(-6);
    toDate = getBoundary(1);
  } else {
    // ALL - essentially the last year up to tomorrow midnight
    fromDate = getBoundary(-365);
    toDate = getBoundary(1);
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
}

/** Parse known URL fields independently so one malformed field cannot erase all valid filters. */
export function parseWorklistUrlState(params: Pick<URLSearchParams, "get">): WorklistUrlState {
  const parseField = <T>(schema: z.ZodType<T>, key: keyof WorklistUrlState, fallback: T): T => {
    const value = params.get(key);
    if (value === null) return fallback;
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : fallback;
  };

  return {
    q: parseField(z.string().trim().max(200), "q", ""),
    datePreset: parseField(DatePresetSchema, "datePreset", DEFAULT_URL_STATE.datePreset),
    modality: parseField(z.string().trim().min(1).max(128), "modality", "ALL"),
    workflowStatus: parseField(z.string().trim().min(1).max(128), "workflowStatus", "ALL"),
    stationAe: parseField(z.string().trim().min(1).max(128), "stationAe", "ALL"),
    assignedDoctor: parseField(z.string().trim().min(1).max(128), "assignedDoctor", "ALL"),
    hisStatus: parseField(z.string().trim().min(1).max(128), "hisStatus", "ALL"),
  };
}

/**
 * Maps the flat URL state into the structured WorklistQueryRequest expected by the backend
 */
export function mapUrlStateToQuery(state: WorklistUrlState, timezone: string = "Asia/Ho_Chi_Minh"): WorklistQueryRequest {
  const { from, to } = resolveDatePreset(state.datePreset, timezone);

  const query: any = {
    from,
    to,
    timezone,
    limit: 100, // Fixed for now, can be added to URL state if pagination is implemented
    sort: { key: "createdAt", direction: "desc" },
  };

  if (state.q) query.q = state.q;
  if (state.modality && state.modality !== "ALL") query.modality = [state.modality];
  if (state.workflowStatus && state.workflowStatus !== "ALL") query.statuses = [state.workflowStatus];
  // Note: the backend contract says dicomNodeIds. We map stationAeFilter to it for now
  if (state.stationAe && state.stationAe !== "ALL") query.dicomNodeIds = [state.stationAe];
  
  if (state.assignedDoctor && state.assignedDoctor !== "ALL") {
    query.assignedDoctorIds = [state.assignedDoctor];
  }

  if (state.hisStatus && state.hisStatus !== "ALL") {
    query.hisStatuses = [state.hisStatus];
  }

  return WorklistQueryRequestSchema.parse(query);
}

/**
 * Hook to manage worklist filters synced with URL search params.
 */
export function useWorklistUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Parse current URL state
  const state = useMemo(() => parseWorklistUrlState(searchParams), [searchParams]);

  // Local state for debounced text input
  const [localSearchQuery, setLocalSearchQuery] = useState(state.q || "");

  // Sync local query when URL changes externally
  useEffect(() => {
    setLocalSearchQuery(state.q || "");
  }, [state.q]);

  // Debounce logic for the text search
  useEffect(() => {
    if (localSearchQuery === (state.q || "")) return;
    const handler = setTimeout(() => {
      setFilters({ q: localSearchQuery });
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearchQuery, state.q]);

  const setFilters = useCallback(
    (updates: Partial<WorklistUrlState>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      let changed = false;

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === DEFAULT_URL_STATE[key as keyof WorklistUrlState]) {
          if (current.has(key)) {
            current.delete(key);
            changed = true;
          }
        } else {
          if (current.get(key) !== value) {
            current.set(key, value as string);
            changed = true;
          }
        }
      }

      if (changed) {
        startTransition(() => {
          const search = current.toString();
          const query = search ? `?${search}` : "";
          router.replace(`${pathname}${query}`, { scroll: false });
        });
      }
    },
    [searchParams, pathname, router]
  );

  const commitSearchNow = useCallback(() => {
    setFilters({ q: localSearchQuery });
  }, [localSearchQuery, setFilters]);

  return {
    state,
    setFilters,
    localSearchQuery,
    setLocalSearchQuery,
    commitSearchNow,
    isPending,
  };
}
