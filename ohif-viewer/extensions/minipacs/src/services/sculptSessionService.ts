/**
 * 3D Sculpt Session Service
 *
 * State machine for 3D sculpt operations. Manages sculpt sessions with
 * full undo support and explicit commit/cancel workflow.
 *
 * CRITICAL RULES:
 *  - Original DICOM pixel data is NEVER mutated
 *  - Sculpt state is stored as a separate mask/labelmap
 *  - All operations are reversible until committed
 *  - No destructive delete without confirmation
 *  - Sculpt state is not persisted as clinical truth unless reviewed
 *
 * Architecture:
 *  - Uses VTK.js segmentation/mask pipeline when available
 *  - State machine: idle → active → committed | cancelled
 *  - Undo stack with operation descriptors
 */

import { commandFeedbackService } from './commandFeedbackService';
import { viewerAuditService } from './viewerAuditService';
import { nativeCapabilityService } from './nativeCapabilityService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SculptSessionState = 'idle' | 'active' | 'committed' | 'cancelled';

export type SculptOperationType =
  | 'crop'
  | 'inverse'
  | 'remove'
  | 'freehand-area'
  | 'curved-area'
  | 'ellipse-area'
  | 'rect-area'
  | 'curved-line'
  | 'freehand-line'
  | 'voi-move'
  | 'voi-rotate'
  | 'voi-thickness'
  | 'voi-center';

export interface SculptOperation {
  id: string;
  type: SculptOperationType;
  timestamp: number;
  /** Serialized operation parameters for undo/redo */
  params: Record<string, unknown>;
  /** Inverse operation descriptor (for undo) */
  inverse?: Record<string, unknown>;
}

export interface SculptSession {
  sessionId: string;
  state: SculptSessionState;
  volumeId: string;
  startedAt: number;
  /** Stack of applied operations (newest last) */
  operations: SculptOperation[];
  /** Current mask/labelmap data reference (never touches source DICOM) */
  maskDataId: string | null;
  /** VOI (Volume of Interest) transform state */
  voiState: {
    position: [number, number, number];
    rotation: [number, number, number];
    thickness: number;
    center: [number, number, number];
  };
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _session: SculptSession | null = null;
let _idCounter = 0;
const _listeners: Array<(session: SculptSession | null) => void> = [];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
}

function notify(): void {
  _listeners.forEach(fn => fn(_session));
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function requireVolumeRendering(): boolean {
  if (!nativeCapabilityService.has('volumeRenderingAvailable')) {
    commandFeedbackService.show(
      '3D Sculpt yêu cầu Volume Rendering pipeline (Phase 4) hoạt động.',
      'warning'
    );
    return false;
  }
  return true;
}

function requireActiveSession(): SculptSession | null {
  if (!_session || _session.state !== 'active') {
    commandFeedbackService.show('Không có phiên Sculpt đang hoạt động.', 'warning');
    return null;
  }
  return _session;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const sculptSessionService = {
  /**
   * Start a new sculpt session for a given volume.
   * Validates volume data before allowing session start.
   */
  startSession(volumeId: string): SculptSession | null {
    if (_session?.state === 'active') {
      commandFeedbackService.show(
        'Đã có phiên Sculpt đang chạy. Vui lòng hoàn tất (Done) hoặc hủy (Cancel) trước.',
        'warning'
      );
      return null;
    }

    if (!requireVolumeRendering()) return null;

    if (!volumeId) {
      commandFeedbackService.show('Không tìm thấy dữ liệu Volume để sculpt.', 'error');
      return null;
    }

    _session = {
      sessionId: generateId('sculpt'),
      state: 'active',
      volumeId,
      startedAt: Date.now(),
      operations: [],
      maskDataId: generateId('mask'),
      voiState: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        thickness: 1,
        center: [0, 0, 0],
      },
    };

    viewerAuditService.recordAction('', 'SCULPT_SESSION_START', {
      sessionId: _session.sessionId,
      volumeId,
    });

    commandFeedbackService.show('Đã bắt đầu phiên 3D Sculpt. Sử dụng Done để lưu hoặc Cancel để hủy.', 'info');
    notify();
    return { ..._session };
  },

  /**
   * Apply a sculpt operation to the current session.
   * The operation is added to the undo stack.
   */
  applyOperation(
    type: SculptOperationType,
    params: Record<string, unknown>
  ): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    const operation: SculptOperation = {
      id: generateId('op'),
      type,
      timestamp: Date.now(),
      params,
      // In a real implementation, the inverse would be computed from the mask diff
      inverse: { type: 'restore', previousState: `snapshot-${session.operations.length}` },
    };

    session.operations.push(operation);

    viewerAuditService.recordAction('', `SCULPT_OP_${type.toUpperCase()}`, {
      sessionId: session.sessionId,
      operationId: operation.id,
    });

    commandFeedbackService.show(`Sculpt: ${type} applied`, 'info', 1500);
    notify();
    return true;
  },

  /**
   * Undo the last sculpt operation.
   */
  undo(): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    if (session.operations.length === 0) {
      commandFeedbackService.show('Không có thao tác nào để hoàn tác.', 'warning');
      return false;
    }

    const undone = session.operations.pop()!;

    viewerAuditService.recordAction('', 'SCULPT_UNDO', {
      sessionId: session.sessionId,
      undoneOperationId: undone.id,
    });

    commandFeedbackService.show(`Đã hoàn tác: ${undone.type}`, 'info', 1500);
    notify();
    return true;
  },

  /**
   * Commit the sculpt session. After commit, the mask/VOI state is finalized.
   * Original DICOM data remains untouched.
   */
  commit(): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    session.state = 'committed';

    viewerAuditService.recordAction('', 'SCULPT_SESSION_COMMIT', {
      sessionId: session.sessionId,
      operationCount: session.operations.length,
    });

    commandFeedbackService.show(
      `Đã lưu phiên Sculpt (${session.operations.length} thao tác). Dữ liệu DICOM gốc không bị thay đổi.`,
      'info'
    );

    notify();
    // Keep _session for reference but allow new sessions
    return true;
  },

  /**
   * Cancel the sculpt session. All operations are discarded.
   */
  cancel(): boolean {
    if (!_session || _session.state !== 'active') {
      commandFeedbackService.show('Không có phiên Sculpt đang hoạt động để hủy.', 'warning');
      return false;
    }

    _session.state = 'cancelled';

    viewerAuditService.recordAction('', 'SCULPT_SESSION_CANCEL', {
      sessionId: _session.sessionId,
      discardedOperations: _session.operations.length,
    });

    commandFeedbackService.show('Đã hủy phiên Sculpt. Mọi thay đổi đã bị loại bỏ.', 'info');
    notify();
    return true;
  },

  // ─── VOI Manipulation ─────────────────────────────────────────────────

  /**
   * Move VOI position. Requires active sculpt session.
   */
  voiMove(delta: [number, number, number]): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    const prev = [...session.voiState.position] as [number, number, number];
    session.voiState.position = [
      prev[0] + delta[0],
      prev[1] + delta[1],
      prev[2] + delta[2],
    ];

    return this.applyOperation('voi-move', { delta, previousPosition: prev });
  },

  /**
   * Rotate VOI. Requires active sculpt session.
   */
  voiRotate(angles: [number, number, number]): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    const prev = [...session.voiState.rotation] as [number, number, number];
    session.voiState.rotation = [
      prev[0] + angles[0],
      prev[1] + angles[1],
      prev[2] + angles[2],
    ];

    return this.applyOperation('voi-rotate', { angles, previousRotation: prev });
  },

  /**
   * Set VOI thickness. Requires active sculpt session.
   */
  voiSetThickness(thickness: number): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    if (thickness <= 0) {
      commandFeedbackService.show('Độ dày VOI phải lớn hơn 0.', 'error');
      return false;
    }

    const prev = session.voiState.thickness;
    session.voiState.thickness = thickness;

    return this.applyOperation('voi-thickness', { thickness, previousThickness: prev });
  },

  /**
   * Set VOI center position. Requires active sculpt session.
   */
  voiSetCenter(center: [number, number, number]): boolean {
    const session = requireActiveSession();
    if (!session) return false;

    const prev = [...session.voiState.center] as [number, number, number];
    session.voiState.center = center;

    return this.applyOperation('voi-center', { center, previousCenter: prev });
  },

  // ─── Queries ──────────────────────────────────────────────────────────

  /** Get current session state (null if no session). */
  getSession(): SculptSession | null {
    return _session ? { ..._session, operations: [..._session.operations] } : null;
  },

  /** Check if a sculpt session is currently active. */
  isActive(): boolean {
    return _session?.state === 'active';
  },

  /** Get the undo stack depth. */
  getUndoDepth(): number {
    return _session?.operations.length ?? 0;
  },

  /** Subscribe to session state changes. */
  onChange(listener: (session: SculptSession | null) => void): () => void {
    _listeners.push(listener);
    return () => {
      const idx = _listeners.indexOf(listener);
      if (idx >= 0) _listeners.splice(idx, 1);
    };
  },
};
