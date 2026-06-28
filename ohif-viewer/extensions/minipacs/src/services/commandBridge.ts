import { MiniPacsTool } from '../config/minipacsToolRegistry';

type CommandBridgeResult = {
  ok: boolean;
  reason?: string;
  message?: string;
};

export function runMiniPacsTool(
  servicesManager: any,
  tool: MiniPacsTool,
  options?: { toggledState?: boolean }
): CommandBridgeResult {
  const context = tool.context || 'CORNERSTONE';

  // Guard against unhandled/unimplemented tool statuses
  if (['backend', 'advanced', 'guarded'].includes(tool.status)) {
    console.warn(`[MiniPACS] Tool ${tool.id} is marked as '${tool.status}' and not fully implemented yet.`);
    return { ok: false, reason: 'not_implemented', message: 'Tính năng đang được phát triển.' };
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
