/**
 * Native Capability Detection Service
 *
 * Detects at runtime what native/external capabilities the current deployment
 * supports. Browser-only mode gets all native capabilities set to false.
 *
 * Detection strategy:
 *  1. Check for Electron/Tauri global APIs (window.__TAURI__, window.electronAPI)
 *  2. Probe localhost companion health endpoint
 *  3. Check server gateway capabilities via /api/capabilities
 *  4. Cache results and expose reactive getters
 */

import { viewerApiClient } from './viewerApiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NativeCapabilities {
  /** True if running inside Electron or Tauri shell */
  electronMode: boolean;
  /** True if a signed native companion service is reachable on localhost */
  localCompanionAvailable: boolean;
  /** True if DICOM Print SCU is available through gateway or companion */
  dicomPrintAvailable: boolean;
  /** True if a document scanner bridge is available */
  scannerAvailable: boolean;
  /** True if CD/DVD burn service is available */
  cdBurnAvailable: boolean;
  /** True if external app launcher is available through companion */
  externalLauncherAvailable: boolean;
  /** True if Phase 4 volume rendering pipeline is operational */
  volumeRenderingAvailable: boolean;
  /** True if server-side gateway supports DICOM DIMSE/STOW-RS operations */
  serverGatewayAvailable: boolean;
}

const DEFAULT_CAPABILITIES: NativeCapabilities = {
  electronMode: false,
  localCompanionAvailable: false,
  dicomPrintAvailable: false,
  scannerAvailable: false,
  cdBurnAvailable: false,
  externalLauncherAvailable: false,
  volumeRenderingAvailable: false,
  serverGatewayAvailable: false,
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _cached: NativeCapabilities | null = null;
let _probePromise: Promise<NativeCapabilities> | null = null;
const _listeners: Array<(caps: NativeCapabilities) => void> = [];

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

function detectElectronMode(): boolean {
  try {
    // Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) return true;
    // Tauri
    if (typeof window !== 'undefined' && (window as any).__TAURI__) return true;
  } catch {
    // ignore
  }
  return false;
}

async function probeLocalCompanion(): Promise<Partial<NativeCapabilities>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://localhost:17580/local/health', {
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(timeout);

    if (!res.ok) return {};

    const data = await res.json();
    return {
      localCompanionAvailable: true,
      scannerAvailable: !!data?.capabilities?.scanner,
      cdBurnAvailable: !!data?.capabilities?.cdBurn,
      externalLauncherAvailable: !!data?.capabilities?.externalLauncher,
      dicomPrintAvailable: !!data?.capabilities?.dicomPrint,
    };
  } catch {
    return { localCompanionAvailable: false };
  }
}

async function probeServerGateway(): Promise<Partial<NativeCapabilities>> {
  try {
    const res = await viewerApiClient.get('/api/capabilities');
    if (res && typeof res === 'object' && (res as any).ok !== false) {
      const payload = (res as any).data || res;
      return {
        serverGatewayAvailable: true,
        dicomPrintAvailable: !!payload?.dicomPrint,
      };
    }
  } catch {
    // Server gateway not available — that's fine for browser-only
  }
  return { serverGatewayAvailable: false };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const nativeCapabilityService = {
  /**
   * Probe all capability sources and cache results.
   * Safe to call multiple times — concurrent calls are coalesced.
   */
  async detect(): Promise<NativeCapabilities> {
    if (_probePromise) return _probePromise;

    _probePromise = (async () => {
      const caps = { ...DEFAULT_CAPABILITIES };

      // 1. Electron/Tauri detection (synchronous)
      caps.electronMode = detectElectronMode();

      // 2. Parallel async probes
      const [companionCaps, gatewayCaps] = await Promise.all([
        probeLocalCompanion(),
        probeServerGateway(),
      ]);

      // Merge with OR logic so false from one source doesn't override true from another
      const allCaps = [companionCaps, gatewayCaps];
      allCaps.forEach(source => {
        Object.entries(source).forEach(([k, v]) => {
          if (v) caps[k as keyof NativeCapabilities] = true;
        });
      });

      // Electron mode unlocks capture capabilities even without companion
      if (caps.electronMode) {
        caps.externalLauncherAvailable = true;
      }

      _cached = caps;
      _probePromise = null;
      _listeners.forEach(fn => fn(caps));
      return caps;
    })();

    return _probePromise;
  },

  /**
   * Return cached capabilities or default (all false).
   * Does NOT trigger a probe. Call detect() first.
   */
  get(): NativeCapabilities {
    return _cached ?? { ...DEFAULT_CAPABILITIES };
  },

  /**
   * Check a single capability by key name.
   */
  has(capability: keyof NativeCapabilities): boolean {
    return (_cached ?? DEFAULT_CAPABILITIES)[capability] ?? false;
  },

  /**
   * Check if ALL required capabilities are available.
   * Used by tool registry guards.
   */
  hasAll(capabilities: Array<keyof NativeCapabilities>): boolean {
    const caps = _cached ?? DEFAULT_CAPABILITIES;
    return capabilities.every(k => caps[k]);
  },

  /**
   * Subscribe to capability changes (e.g. after re-probe).
   */
  onChange(listener: (caps: NativeCapabilities) => void): () => void {
    _listeners.push(listener);
    return () => {
      const idx = _listeners.indexOf(listener);
      if (idx >= 0) _listeners.splice(idx, 1);
    };
  },

  /**
   * Force re-probe (e.g. after user installs companion).
   */
  async reprobeAll(): Promise<NativeCapabilities> {
    _cached = null;
    _probePromise = null;
    return this.detect();
  },
};
