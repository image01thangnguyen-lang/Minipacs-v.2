import { HisAdapter } from "./types";
import { MockHisAdapter } from "./mockHisAdapter";
import { RestHisAdapter } from "./restHisAdapter";
import { getActiveHisConfig } from "./hisConfigService";

const mockAdapter = new MockHisAdapter();
const restAdapter = new RestHisAdapter();

export async function getHisAdapter(): Promise<HisAdapter | null> {
  const config = await getActiveHisConfig();
  const mode = config?.mode?.toLowerCase();

  if (!mode || mode === "disabled") {
    return null;
  }

  if (mode === "mock") {
    return mockAdapter;
  }

  if (mode === "rest") {
    return restAdapter;
  }

  // Fallback to null if unknown
  return null;
}
