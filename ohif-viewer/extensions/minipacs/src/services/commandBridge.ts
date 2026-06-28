import { MiniPacsTool } from '../config/minipacsToolRegistry';
import { commandFeedbackService } from './commandFeedbackService';

type CommandBridgeResult = {
  ok: boolean;
  reason?: string;
  message?: string;
};

export function runMiniPacsTool(
  servicesManager: any,
  tool: MiniPacsTool,
  options?: { toggledState?: boolean; viewportId?: string }
): CommandBridgeResult {
  const context = tool.context || 'CORNERSTONE';
  const { viewportGridService } = servicesManager.services;

  // Guard against unhandled/unimplemented tool statuses
  if (['backend', 'advanced', 'guarded'].includes(tool.status)) {
    const msg = tool.status === 'guarded' ? 'Hành động này bị khóa để đảm bảo an toàn.' : 'Tính năng đang chờ API Backend.';
    commandFeedbackService.show(`${tool.label}: ${msg}`, 'warning');
    return { ok: false, reason: 'not_implemented', message: msg };
  }

  // --- FEATURE 1: Fullscreen / Restore ---
  if (tool.commandName === 'toggleFullscreen') {
    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      interactionType: 'action',
      commands: [
        {
          commandName: 'toggleOneUp',
          commandOptions: {},
          context: 'DEFAULT',
        },
      ],
    });
    return { ok: true };
  }

  // --- FEATURE 2: Sync ---
  if (tool.commandName === 'toggleSync') {
    const syncItemId = 'StackImageSync';
    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      itemId: syncItemId,
      interactionType: 'toggle',
      commands: [
        {
          commandName: 'toggleStackImageSync',
          commandOptions: { toggledState: options?.toggledState },
          context: 'CORNERSTONE',
        },
      ],
    });
    const isToggled = servicesManager.services.toolbarService.state.toggles[syncItemId];
    commandFeedbackService.show(isToggled ? 'Đã bật đồng bộ các khung hình (Sync)' : 'Đã tắt đồng bộ', 'info', 2000);
    return { ok: true };
  }

  // --- FEATURE 4: Snapshot / Download ---
  if (tool.commandName === 'showDownloadViewportModal') {
    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      interactionType: 'action',
      commands: [
        {
          commandName: 'showDownloadViewportModal',
          commandOptions: { title: 'Download Viewport' },
          context: 'CORNERSTONE',
        },
      ],
    });
    return { ok: true };
  }

  if (tool.type === 'tool') {
    const toolName = tool.commandOptions?.toolName || tool.id;
    const toolGroupId = tool.commandOptions?.toolGroupId;

    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      interactionType: 'tool',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: { toolName, ...(toolGroupId ? { toolGroupId } : {}) },
          context,
        },
      ],
    });
    return { ok: true };

  } else if (tool.type === 'action') {
    const cmdName = tool.commandName;
    if (!cmdName) {
      if (/^[1-9]x[1-9]$/.test(tool.id)) {
        const [rows, cols] = tool.id.split('x').map(Number);
        servicesManager.services.toolbarService.recordInteraction({
          groupId: 'default',
          interactionType: 'action',
          commands: [
            {
              commandName: 'setViewportGridLayout',
              commandOptions: { numRows: rows, numCols: cols },
              context: 'DEFAULT',
            },
          ],
        });
        return { ok: true };
      }
      return { ok: false, reason: 'no_command' };
    }

    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      interactionType: 'action',
      commands: [
        {
          commandName: cmdName,
          commandOptions: tool.commandOptions || {},
          context,
        },
      ],
    });
    return { ok: true };

  } else if (tool.type === 'toggle') {
    const cmdName = tool.commandName;
    if (!cmdName) return { ok: false, reason: 'no_command' };

    servicesManager.services.toolbarService.recordInteraction({
      groupId: 'default',
      itemId: tool.id,
      interactionType: 'toggle',
      commands: [
        {
          commandName: cmdName,
          commandOptions: { ...tool.commandOptions, toggledState: options?.toggledState },
          context,
        },
      ],
    });
    return { ok: true };
  }

  return { ok: false, reason: 'unknown_type' };
}
