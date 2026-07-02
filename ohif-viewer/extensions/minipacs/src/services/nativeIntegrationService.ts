/**
 * Native Integration Service
 *
 * Provides safe, audited access to native/external operations.
 * Every method:
 *  1. Checks capability before executing
 *  2. Audits the operation
 *  3. Returns structured result
 *  4. Handles failures gracefully
 *
 * SECURITY:
 *  - No arbitrary command execution
 *  - No unrestricted filesystem traversal
 *  - No silent PHI export
 *  - External apps must be on allowlist
 */

import { nativeCapabilityService, NativeCapabilities } from './nativeCapabilityService';
import { viewerAuditService } from './viewerAuditService';
import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NativeResult {
  ok: boolean;
  reason?: string;
  message?: string;
  data?: unknown;
}

export interface PrinterConfig {
  aeTitle: string;
  host: string;
  port: number;
  filmSize?: string;
  layout?: string;
}

export interface ExternalAppConfig {
  appId: string;
  displayName: string;
  /** Only these app IDs are allowed to launch */
  allowlisted: boolean;
}

/**
 * Hardcoded allowlist of external applications that may be launched.
 * Any app not on this list will be rejected.
 */
const EXTERNAL_APP_ALLOWLIST: Record<string, ExternalAppConfig> = {
  xelis: { appId: 'xelis', displayName: 'Xelis 3D', allowlisted: true },
  dgate: { appId: 'dgate', displayName: 'D.gate', allowlisted: true },
  tfs: { appId: 'tfs', displayName: 'TFS', allowlisted: true },
  external1: { appId: 'external1', displayName: 'External Link 1', allowlisted: true },
  external2: { appId: 'external2', displayName: 'External Link 2', allowlisted: true },
  external3: { appId: 'external3', displayName: 'External Link 3', allowlisted: true },
  external4: { appId: 'external4', displayName: 'External Link 4', allowlisted: true },
  external5: { appId: 'external5', displayName: 'External Link 5', allowlisted: true },
  external6: { appId: 'external6', displayName: 'External Link 6', allowlisted: true },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capabilityGuard(
  requiredCaps: Array<keyof NativeCapabilities>,
  actionLabel: string
): NativeResult | null {
  if (!nativeCapabilityService.hasAll(requiredCaps)) {
    const missing = requiredCaps.filter(c => !nativeCapabilityService.has(c));
    const msg = `${actionLabel}: Không khả dụng. Yêu cầu: ${missing.join(', ')}`;
    commandFeedbackService.show(msg, 'warning');
    return { ok: false, reason: 'capability_missing', message: msg };
  }
  return null; // All clear
}

async function companionPost(endpoint: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://localhost:17580${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Companion error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const nativeIntegrationService = {
  // ─── Local DICOM ──────────────────────────────────────────────────────

  /**
   * Send DICOM study to a local or remote DICOM destination via server gateway.
   */
  async sendLocalDicom(
    studyInstanceUid: string,
    destination: { aeTitle: string; host: string; port: number }
  ): Promise<NativeResult> {
    const guard = capabilityGuard(['serverGatewayAvailable'], 'Send Local DICOM');
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'DICOM_SEND', {
      destination: destination.aeTitle,
    });

    try {
      const result = await viewerApiClient.post('/api/dicom/send', {
        studyInstanceUid,
        ...destination,
      });
      if (!result || (result as any).ok === false || (result as any).data?.success === false) {
        throw new Error((result as any)?.message || (result as any)?.data?.message || 'Server Gateway Error');
      }
      commandFeedbackService.show('Đã gửi DICOM thành công', 'info');
      return { ok: true, data: (result as any).data ?? null };
    } catch (err: any) {
      commandFeedbackService.show(`Gửi DICOM thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'send_failed', message: err.message };
    }
  },

  // ─── Open Local Folder ────────────────────────────────────────────────

  /**
   * Open a local DICOM folder.
   * In browser-only mode, uses <input type="file" webkitdirectory>.
   * With companion, uses native folder dialog.
   */
  async openLocalFolder(): Promise<NativeResult> {
    if (nativeCapabilityService.has('localCompanionAvailable')) {
      viewerAuditService.recordAction('', 'OPEN_LOCAL_FOLDER_COMPANION');
      try {
        const result = await companionPost('/local/dicom/open-folder', {});
        return { ok: true, data: result };
      } catch (err: any) {
        commandFeedbackService.show(`Mở thư mục thất bại: ${err.message}`, 'error');
        return { ok: false, reason: 'open_failed', message: err.message };
      }
    }

    // Browser fallback: file picker
    viewerAuditService.recordAction('', 'OPEN_LOCAL_FOLDER_BROWSER');
    commandFeedbackService.show(
      'Chức năng mở thư mục đầy đủ yêu cầu Native Companion. Sử dụng file picker trình duyệt.',
      'warning'
    );
    return { ok: false, reason: 'browser_only', message: 'Use browser file picker' };
  },

  // ─── Scanner ──────────────────────────────────────────────────────────

  /**
   * Scan a document and attach to current study.
   */
  async scanDocument(studyInstanceUid: string): Promise<NativeResult> {
    const guard = capabilityGuard(
      ['localCompanionAvailable', 'scannerAvailable'],
      'Scan Doc'
    );
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'SCAN_DOCUMENT');

    try {
      const result = await companionPost('/local/scanner/scan', { studyInstanceUid });
      commandFeedbackService.show('Đã quét tài liệu thành công', 'info');
      return { ok: true, data: result };
    } catch (err: any) {
      commandFeedbackService.show(`Quét tài liệu thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'scan_failed', message: err.message };
    }
  },

  // ─── CD Burn ──────────────────────────────────────────────────────────

  /**
   * Create CD/DVD export media.
   */
  async burnCD(
    studyInstanceUid: string,
    options?: { includeViewer?: boolean; includeDicomdir?: boolean }
  ): Promise<NativeResult> {
    const guard = capabilityGuard(
      ['localCompanionAvailable', 'cdBurnAvailable'],
      'CD Burn'
    );
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'CD_BURN', options);

    try {
      const result = await companionPost('/local/cd-burn/create', {
        studyInstanceUid,
        ...options,
      });
      commandFeedbackService.show('Đang tạo đĩa CD/DVD...', 'info');
      return { ok: true, data: result };
    } catch (err: any) {
      commandFeedbackService.show(`Ghi đĩa thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'burn_failed', message: err.message };
    }
  },

  // ─── Direct Print ─────────────────────────────────────────────────────

  /**
   * Send DICOM Print job through gateway or companion.
   */
  async directPrint(
    studyInstanceUid: string,
    printerConfig: PrinterConfig
  ): Promise<NativeResult> {
    const guard = capabilityGuard(['dicomPrintAvailable'], 'Direct DICOM Print');
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'DICOM_PRINT', {
      printer: printerConfig.aeTitle,
    });

    try {
      // Prefer server gateway, fallback to companion
      if (nativeCapabilityService.has('serverGatewayAvailable')) {
        const result = await viewerApiClient.post('/api/dicom/print', {
          studyInstanceUid,
          ...printerConfig,
        });
        if (!result || (result as any).ok === false || (result as any).data?.success === false) {
          throw new Error((result as any)?.message || (result as any)?.data?.message || 'Server Gateway Error');
        }
        commandFeedbackService.show('Đã gửi lệnh in DICOM', 'info');
        return { ok: true, data: (result as any).data ?? null };
      }

      const result = await companionPost('/local/print/dicom-film', {
        studyInstanceUid,
        ...printerConfig,
      });
      commandFeedbackService.show('Đã gửi lệnh in DICOM', 'info');
      return { ok: true, data: result };
    } catch (err: any) {
      commandFeedbackService.show(`In DICOM thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'print_failed', message: err.message };
    }
  },

  // ─── Screen Capture ───────────────────────────────────────────────────

  /**
   * Capture current monitor (Electron/Tauri only).
   */
  async captureMonitor(): Promise<NativeResult> {
    const guard = capabilityGuard(['electronMode'], 'Capture Monitor');
    if (guard) return guard;

    viewerAuditService.recordAction('', 'CAPTURE_MONITOR');

    try {
      if ((window as any).electronAPI?.captureScreen) {
        const data = await (window as any).electronAPI.captureScreen('current');
        return { ok: true, data };
      }
      return { ok: false, reason: 'no_api', message: 'Screen capture API not available' };
    } catch (err: any) {
      return { ok: false, reason: 'capture_failed', message: err.message };
    }
  },

  /**
   * Capture all screens (Electron/Tauri only).
   */
  async captureAllScreens(): Promise<NativeResult> {
    const guard = capabilityGuard(['electronMode'], 'Capture All Screens');
    if (guard) return guard;

    viewerAuditService.recordAction('', 'CAPTURE_ALL_SCREENS');

    try {
      if ((window as any).electronAPI?.captureScreen) {
        const data = await (window as any).electronAPI.captureScreen('all');
        return { ok: true, data };
      }
      return { ok: false, reason: 'no_api', message: 'Screen capture API not available' };
    } catch (err: any) {
      return { ok: false, reason: 'capture_failed', message: err.message };
    }
  },

  // ─── External App Launch ──────────────────────────────────────────────

  /**
   * Launch an external application from the allowlist.
   */
  async launchExternalApp(
    appId: string,
    params?: Record<string, string>
  ): Promise<NativeResult> {
    // Allowlist check
    const appConfig = EXTERNAL_APP_ALLOWLIST[appId];
    if (!appConfig || !appConfig.allowlisted) {
      const msg = `Ứng dụng "${appId}" không nằm trong danh sách cho phép.`;
      commandFeedbackService.show(msg, 'error');
      viewerAuditService.recordAction('', 'EXTERNAL_APP_REJECTED', { appId });
      return { ok: false, reason: 'not_allowlisted', message: msg };
    }

    const guard = capabilityGuard(
      ['localCompanionAvailable', 'externalLauncherAvailable'],
      `Launch ${appConfig.displayName}`
    );
    if (guard) return guard;

    viewerAuditService.recordAction('', 'EXTERNAL_APP_LAUNCH', { appId, params });

    try {
      const result = await companionPost('/local/external/launch', { appId, params });
      commandFeedbackService.show(`Đã mở ${appConfig.displayName}`, 'info');
      return { ok: true, data: result };
    } catch (err: any) {
      commandFeedbackService.show(`Mở ${appConfig.displayName} thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'launch_failed', message: err.message };
    }
  },

  // ─── Gateway/Vendor Integrations ──────────────────────────────────────

  /**
   * Send study to TFS via server gateway.
   */
  async sendToTFS(studyInstanceUid: string): Promise<NativeResult> {
    const guard = capabilityGuard(['serverGatewayAvailable'], 'Send to TFS');
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'SEND_TO_TFS');

    try {
      const result = await viewerApiClient.post('/api/integrations/tfs/send', {
        studyInstanceUid,
      });
      if (!result || (result as any).ok === false || (result as any).data?.success === false) {
        throw new Error((result as any)?.message || (result as any)?.data?.message || 'Server Gateway Error');
      }
      commandFeedbackService.show('Đã gửi đến TFS', 'info');
      return { ok: true, data: (result as any).data ?? null };
    } catch (err: any) {
      commandFeedbackService.show(`Gửi TFS thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'tfs_failed', message: err.message };
    }
  },

  /**
   * Send study to D.gate via server gateway.
   */
  async sendToDgate(studyInstanceUid: string): Promise<NativeResult> {
    const guard = capabilityGuard(['serverGatewayAvailable'], 'Send to D.gate');
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'SEND_TO_DGATE');

    try {
      const result = await viewerApiClient.post('/api/integrations/dgate/send', {
        studyInstanceUid,
      });
      if (!result || (result as any).ok === false || (result as any).data?.success === false) {
        throw new Error((result as any)?.message || (result as any)?.data?.message || 'Server Gateway Error');
      }
      commandFeedbackService.show('Đã gửi đến D.gate', 'info');
      return { ok: true, data: (result as any).data ?? null };
    } catch (err: any) {
      commandFeedbackService.show(`Gửi D.gate thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'dgate_failed', message: err.message };
    }
  },

  // ─── Dictation ────────────────────────────────────────────────────────

  /**
   * Start dictation session (requires companion or native mode).
   */
  async startDictation(studyInstanceUid: string): Promise<NativeResult> {
    const guard = capabilityGuard(['localCompanionAvailable'], 'Dictation');
    if (guard) return guard;

    viewerAuditService.recordAction(studyInstanceUid, 'DICTATION_START');

    try {
      const result = await companionPost('/local/dictation/start', { studyInstanceUid });
      return { ok: true, data: result };
    } catch (err: any) {
      commandFeedbackService.show(`Khởi động đọc chính tả thất bại: ${err.message}`, 'error');
      return { ok: false, reason: 'dictation_failed', message: err.message };
    }
  },

  /**
   * Play back a dictation recording.
   */
  async playDictation(recordingId: string): Promise<NativeResult> {
    const guard = capabilityGuard(['localCompanionAvailable'], 'Play Dictation');
    if (guard) return guard;

    viewerAuditService.recordAction('', 'DICTATION_PLAY', { recordingId });

    try {
      const result = await companionPost('/local/dictation/play', { recordingId });
      return { ok: true, data: result };
    } catch (err: any) {
      return { ok: false, reason: 'play_failed', message: err.message };
    }
  },

  // ─── Native Window Controls ───────────────────────────────────────────

  nativeExit(): NativeResult {
    if (!nativeCapabilityService.has('electronMode')) {
      commandFeedbackService.show('Chức năng Exit chỉ khả dụng trên ứng dụng Desktop', 'warning');
      return { ok: false, reason: 'not_native' };
    }
    viewerAuditService.recordAction('', 'NATIVE_EXIT');
    try {
      if (!(window as any).electronAPI?.close) {
        return { ok: false, reason: 'no_api', message: 'Close API not available' };
      }
      (window as any).electronAPI.close();
      return { ok: true };
    } catch {
      return { ok: false, reason: 'exit_failed' };
    }
  },

  nativeMinimize(): NativeResult {
    if (!nativeCapabilityService.has('electronMode')) {
      return { ok: false, reason: 'not_native' };
    }
    viewerAuditService.recordAction('', 'NATIVE_MINIMIZE');
    try {
      if (!(window as any).electronAPI?.minimize) {
        return { ok: false, reason: 'no_api', message: 'Minimize API not available' };
      }
      (window as any).electronAPI.minimize();
      return { ok: true };
    } catch {
      return { ok: false, reason: 'minimize_failed' };
    }
  },

  nativeResize(): NativeResult {
    if (!nativeCapabilityService.has('electronMode')) {
      return { ok: false, reason: 'not_native' };
    }
    viewerAuditService.recordAction('', 'NATIVE_RESIZE');
    try {
      if (!(window as any).electronAPI?.resize) {
        return { ok: false, reason: 'no_api', message: 'Resize API not available' };
      }
      (window as any).electronAPI.resize();
      return { ok: true };
    } catch {
      return { ok: false, reason: 'resize_failed' };
    }
  },
};
