/**
 * Virtual Endoscopy Service
 *
 * Camera path management for virtual endoscopy workflows.
 * Only enables for validated volume data with hollow-organ characteristics.
 *
 * RULES:
 *  - Validates volume eligibility before enabling
 *  - Manages camera paths as arrays of 3D waypoints
 *  - Supports on-path and free-camera modes
 *  - Forward/backward navigation along path
 *  - Defers gracefully if volume data is not appropriate
 */

import { commandFeedbackService } from './commandFeedbackService';
import { viewerAuditService } from './viewerAuditService';
import { nativeCapabilityService } from './nativeCapabilityService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EndoscopyWaypoint {
  /** World-coordinate position */
  position: [number, number, number];
  /** Camera look-at direction */
  direction: [number, number, number];
  /** Camera up vector */
  up: [number, number, number];
  /** Field of view in degrees */
  fov: number;
}

export interface EndoscopyPath {
  id: string;
  name: string;
  waypoints: EndoscopyWaypoint[];
  createdAt: number;
}

export type EndoscopyCameraMode = 'on-path' | 'free';

export interface EndoscopySession {
  volumeId: string;
  paths: EndoscopyPath[];
  activePathId: string | null;
  /** Current position index along the active path */
  pathIndex: number;
  cameraMode: EndoscopyCameraMode;
  /** Current camera state (may differ from path when in free mode) */
  camera: EndoscopyWaypoint;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _session: EndoscopySession | null = null;
let _idCounter = 0;
const _listeners: Array<(session: EndoscopySession | null) => void> = [];

function generateId(): string {
  return `ve-path-${Date.now()}-${++_idCounter}`;
}

function notify(): void {
  _listeners.forEach(fn => fn(_session));
}

const DEFAULT_CAMERA: EndoscopyWaypoint = {
  position: [0, 0, 0],
  direction: [0, 0, 1],
  up: [0, 1, 0],
  fov: 90,
};

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function requireVolumeCapability(): boolean {
  if (!nativeCapabilityService.has('volumeRenderingAvailable')) {
    commandFeedbackService.show(
      'Virtual Endoscopy yêu cầu Volume Rendering pipeline (Phase 4).',
      'warning'
    );
    return false;
  }
  return true;
}

function requireSession(): EndoscopySession | null {
  if (!_session) {
    commandFeedbackService.show('Chưa khởi tạo phiên Virtual Endoscopy.', 'warning');
    return null;
  }
  return _session;
}

function requireActivePath(): { session: EndoscopySession; path: EndoscopyPath } | null {
  const session = requireSession();
  if (!session) return null;

  if (!session.activePathId) {
    commandFeedbackService.show('Chưa chọn đường dẫn (path) nào.', 'warning');
    return null;
  }

  const path = session.paths.find(p => p.id === session.activePathId);
  if (!path) {
    commandFeedbackService.show('Đường dẫn đã bị xóa.', 'error');
    return null;
  }

  return { session, path };
}

// ---------------------------------------------------------------------------
// Volume Validation
// ---------------------------------------------------------------------------

/**
 * Validate whether volume data is suitable for virtual endoscopy.
 * In a full implementation, this would check:
 *  - Modality (CT preferred)
 *  - Sufficient resolution
 *  - Hollow-organ presence (airway, colon, vessel)
 *  - Volume dimensions
 *
 * For now, we check basic volume availability.
 */
function validateVolumeForEndoscopy(volumeId: string): {
  valid: boolean;
  reason?: string;
} {
  if (!volumeId) {
    return { valid: false, reason: 'No volume data available' };
  }

  // In a real implementation, we would inspect the volume metadata:
  // - Check voxel spacing for adequate resolution
  // - Check modality for CT/CTA
  // - Check that volume is loaded and has sufficient slices
  // For now, we accept any valid volumeId as a stub
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const virtualEndoscopyService = {
  /**
   * Initialize a virtual endoscopy session for a volume.
   * Validates volume eligibility before enabling.
   */
  initSession(volumeId: string): boolean {
    if (!requireVolumeCapability()) return false;

    const validation = validateVolumeForEndoscopy(volumeId);
    if (!validation.valid) {
      commandFeedbackService.show(
        `Virtual Endoscopy không hỗ trợ cho dữ liệu này: ${validation.reason}`,
        'warning'
      );
      return false;
    }

    _session = {
      volumeId,
      paths: [],
      activePathId: null,
      pathIndex: 0,
      cameraMode: 'free',
      camera: { ...DEFAULT_CAMERA },
    };

    viewerAuditService.recordAction('', 'VE_SESSION_INIT', { volumeId });
    commandFeedbackService.show('Đã khởi tạo phiên Virtual Endoscopy.', 'info');
    notify();
    return true;
  },

  /**
   * Add a new path to the session.
   */
  addPath(name?: string): EndoscopyPath | null {
    const session = requireSession();
    if (!session) return null;

    const path: EndoscopyPath = {
      id: generateId(),
      name: name || `Path ${session.paths.length + 1}`,
      waypoints: [],
      createdAt: Date.now(),
    };

    session.paths.push(path);
    session.activePathId = path.id;

    viewerAuditService.recordAction('', 'VE_PATH_ADD', { pathId: path.id });
    commandFeedbackService.show(`Đã thêm đường dẫn: ${path.name}`, 'info', 1500);
    notify();
    return { ...path };
  },

  /**
   * Remove a path from the session.
   */
  removePath(pathId: string): boolean {
    const session = requireSession();
    if (!session) return false;

    const idx = session.paths.findIndex(p => p.id === pathId);
    if (idx < 0) {
      commandFeedbackService.show('Đường dẫn không tồn tại.', 'warning');
      return false;
    }

    const removed = session.paths.splice(idx, 1)[0];

    // Clear active path if it was the removed one
    if (session.activePathId === pathId) {
      session.activePathId = session.paths.length > 0 ? session.paths[0].id : null;
      session.pathIndex = 0;
    }

    viewerAuditService.recordAction('', 'VE_PATH_REMOVE', { pathId, name: removed.name });
    commandFeedbackService.show(`Đã xóa đường dẫn: ${removed.name}`, 'info', 1500);
    notify();
    return true;
  },

  /**
   * Add a waypoint to the active path at current camera position.
   */
  addWaypoint(waypoint?: Partial<EndoscopyWaypoint>): boolean {
    const ctx = requireActivePath();
    if (!ctx) return false;

    const wp: EndoscopyWaypoint = {
      position: waypoint?.position ?? ctx.session.camera.position,
      direction: waypoint?.direction ?? ctx.session.camera.direction,
      up: waypoint?.up ?? ctx.session.camera.up,
      fov: waypoint?.fov ?? ctx.session.camera.fov,
    };

    ctx.path.waypoints.push(wp);
    notify();
    return true;
  },

  /**
   * Set camera to follow the active path.
   */
  setCameraOnPath(): boolean {
    const ctx = requireActivePath();
    if (!ctx) return false;

    if (ctx.path.waypoints.length === 0) {
      commandFeedbackService.show('Đường dẫn chưa có điểm nào. Hãy thêm waypoint trước.', 'warning');
      return false;
    }

    ctx.session.cameraMode = 'on-path';
    ctx.session.pathIndex = Math.min(ctx.session.pathIndex, ctx.path.waypoints.length - 1);
    ctx.session.camera = { ...ctx.path.waypoints[ctx.session.pathIndex] };

    commandFeedbackService.show('Camera đang theo đường dẫn.', 'info', 1500);
    notify();
    return true;
  },

  /**
   * Set camera to free mode (detached from path).
   */
  setCameraFree(): boolean {
    const session = requireSession();
    if (!session) return false;

    session.cameraMode = 'free';
    commandFeedbackService.show('Camera tự do (không theo đường dẫn).', 'info', 1500);
    notify();
    return true;
  },

  /**
   * Move forward along the active path.
   */
  moveForward(steps: number = 1): boolean {
    const ctx = requireActivePath();
    if (!ctx) return false;

    if (ctx.path.waypoints.length === 0) return false;

    const newIndex = Math.min(
      ctx.session.pathIndex + steps,
      ctx.path.waypoints.length - 1
    );

    if (newIndex === ctx.session.pathIndex) {
      commandFeedbackService.show('Đã đến cuối đường dẫn.', 'info', 1500);
      return false;
    }

    ctx.session.pathIndex = newIndex;
    if (ctx.session.cameraMode === 'on-path') {
      ctx.session.camera = { ...ctx.path.waypoints[newIndex] };
    }

    notify();
    return true;
  },

  /**
   * Move backward along the active path.
   */
  moveBackward(steps: number = 1): boolean {
    const ctx = requireActivePath();
    if (!ctx) return false;

    if (ctx.path.waypoints.length === 0) return false;

    const newIndex = Math.max(ctx.session.pathIndex - steps, 0);

    if (newIndex === ctx.session.pathIndex) {
      commandFeedbackService.show('Đã đến đầu đường dẫn.', 'info', 1500);
      return false;
    }

    ctx.session.pathIndex = newIndex;
    if (ctx.session.cameraMode === 'on-path') {
      ctx.session.camera = { ...ctx.path.waypoints[newIndex] };
    }

    notify();
    return true;
  },

  // ─── Queries ──────────────────────────────────────────────────────────

  getSession(): EndoscopySession | null {
    return _session ? { ..._session } : null;
  },

  isActive(): boolean {
    return _session !== null;
  },

  /** End the endoscopy session and clean up. */
  endSession(): void {
    if (_session) {
      viewerAuditService.recordAction('', 'VE_SESSION_END');
      _session = null;
      notify();
    }
  },

  onChange(listener: (session: EndoscopySession | null) => void): () => void {
    _listeners.push(listener);
    return () => {
      const idx = _listeners.indexOf(listener);
      if (idx >= 0) _listeners.splice(idx, 1);
    };
  },
};
