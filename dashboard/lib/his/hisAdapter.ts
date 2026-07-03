import { HisAdapter } from "./types";
import { MockHisAdapter } from "./mockHisAdapter";

// Add other adapters here when implemented, e.g. RestHisAdapter

let activeAdapter: HisAdapter | null = null;

export function getHisAdapter(): HisAdapter | null {
  if (activeAdapter) return activeAdapter;

  const mode = process.env.HIS_INTEGRATION_MODE?.toLowerCase();

  if (!mode || mode === "disabled") {
    return null;
  }

  if (mode === "mock") {
    activeAdapter = new MockHisAdapter();
    return activeAdapter;
  }

  // Fallback to null if unknown
  return null;
}
