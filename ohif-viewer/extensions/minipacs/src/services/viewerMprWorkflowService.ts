export type MprEligibility = {
  ok: boolean;
  reason?: string;
  displaySetInstanceUID?: string;
  modality?: string;
  seriesDescription?: string;
};

class ViewerMprWorkflowService {
  private servicesManager: any;
  private commandsManager: any;

  public initialize(servicesManager: any, commandsManager: any) {
    this.servicesManager = servicesManager;
    this.commandsManager = commandsManager;
  }

  private getActiveDisplaySet(): any | null {
    if (!this.servicesManager) return null;
    const { viewportGridService, displaySetService } = this.servicesManager.services;
    const viewportState = viewportGridService.getState();
    const activeViewport = viewportState.viewports.get(viewportState.activeViewportId);
    
    if (!activeViewport || !activeViewport.displaySetInstanceUIDs || activeViewport.displaySetInstanceUIDs.length === 0) {
      return null;
    }

    const uid = activeViewport.displaySetInstanceUIDs[0];
    const displaySets = displaySetService.getActiveDisplaySets();
    return displaySets.find((ds: any) => ds.displaySetInstanceUID === uid) || null;
  }

  public canEnterMpr(): MprEligibility {
    const displaySet = this.getActiveDisplaySet();
    
    if (!displaySet) {
      return { ok: false, reason: 'No active display set found.' };
    }

    const uid = displaySet.displaySetInstanceUID;
    const mod = displaySet.Modality;
    const desc = displaySet.SeriesDescription;

    if (!displaySet.isReconstructable) {
      return { ok: false, reason: 'Series is not reconstructable (missing orientation, position, or sufficient frames).', displaySetInstanceUID: uid, modality: mod, seriesDescription: desc };
    }

    // Usually only CT and MR are reliably MPR capable in this context
    if (mod !== 'CT' && mod !== 'MR' && mod !== 'PT') {
      return { ok: false, reason: `Modality ${mod} is generally not supported for MPR.`, displaySetInstanceUID: uid, modality: mod, seriesDescription: desc };
    }

    return { ok: true, displaySetInstanceUID: uid, modality: mod, seriesDescription: desc };
  }

  public isInMpr(): boolean {
    if (!this.servicesManager) return false;
    const { hangingProtocolService } = this.servicesManager.services;
    const hpState = hangingProtocolService.getState();
    return hpState && (hpState.protocolId === 'mpr' || hpState.protocolId === 'mprAnd3DVolumeViewport');
  }

  public async exitCurrentMprProtocol(): Promise<boolean> {
    if (!this.servicesManager || !this.commandsManager) return false;
    const { hangingProtocolService } = this.servicesManager.services;
    const hpState = hangingProtocolService.getState();
    const protocolId = hpState ? hpState.protocolId : null;

    if (protocolId === 'mpr' || protocolId === 'mprAnd3DVolumeViewport') {
      this.commandsManager.runCommand('toggleHangingProtocol', { protocolId });
      this.audit(protocolId === 'mpr' ? 'mpr_exited' : 'mip_exited', { protocolId });
      return true;
    }
    return false;
  }

  public async toggleMpr(): Promise<boolean> {
    if (!this.servicesManager || !this.commandsManager) return false;
    const { uiNotificationService, hangingProtocolService } = this.servicesManager.services;
    const hpState = hangingProtocolService.getState();
    const protocolId = hpState ? hpState.protocolId : null;

    if (protocolId === 'mpr') {
      // Exit MPR
      this.commandsManager.runCommand('toggleHangingProtocol', { protocolId: 'mpr' });
      this.audit('mpr_exited', { protocolId: 'mpr' });
      return true;
    }

    const eligibility = this.canEnterMpr();
    if (!eligibility.ok) {
      if (uiNotificationService) {
        uiNotificationService.show({
          title: 'MPR Not Available',
          message: eligibility.reason,
          type: 'error',
        });
      }
      this.audit('mpr_rejected', { reason: eligibility.reason, uid: eligibility.displaySetInstanceUID, modality: eligibility.modality });
      return false;
    }

    // Switch or Enter
    this.commandsManager.runCommand('toggleHangingProtocol', { protocolId: 'mpr' });
    if (protocolId === 'mprAnd3DVolumeViewport') {
      this.audit('mpr_switched_from_mip', { protocolId: 'mpr', uid: eligibility.displaySetInstanceUID });
    } else {
      this.audit('mpr_entered', { protocolId: 'mpr', uid: eligibility.displaySetInstanceUID });
    }
    return true;
  }

  public async toggleMipVolume(): Promise<boolean> {
    if (!this.servicesManager || !this.commandsManager) return false;
    const { uiNotificationService, hangingProtocolService } = this.servicesManager.services;
    const hpState = hangingProtocolService.getState();
    const protocolId = hpState ? hpState.protocolId : null;

    if (protocolId === 'mprAnd3DVolumeViewport') {
      // Exit MIP
      this.commandsManager.runCommand('toggleHangingProtocol', { protocolId: 'mprAnd3DVolumeViewport' });
      this.audit('mip_exited', { protocolId: 'mprAnd3DVolumeViewport' });
      return true;
    }

    const eligibility = this.canEnterMpr();
    if (!eligibility.ok) {
      if (uiNotificationService) {
        uiNotificationService.show({
          title: 'MIP/3D Not Available',
          message: eligibility.reason,
          type: 'error',
        });
      }
      this.audit('mip_rejected', { reason: eligibility.reason, uid: eligibility.displaySetInstanceUID, modality: eligibility.modality });
      return false;
    }

    // Switch or Enter
    this.commandsManager.runCommand('toggleHangingProtocol', { protocolId: 'mprAnd3DVolumeViewport' });
    if (protocolId === 'mpr') {
      this.audit('mip_entered_from_mpr', { protocolId: 'mprAnd3DVolumeViewport', uid: eligibility.displaySetInstanceUID });
    } else {
      this.audit('mip_entered', { protocolId: 'mprAnd3DVolumeViewport', uid: eligibility.displaySetInstanceUID });
    }
    return true;
  }

  public setCrosshairsEnabled(enabled: boolean = true): boolean {
    if (!this.servicesManager || !this.commandsManager) return false;
    const { uiNotificationService, viewportGridService, toolGroupService } = this.servicesManager.services;

    if (!this.isInMpr()) {
      if (uiNotificationService) {
        uiNotificationService.show({
          title: 'Crosshairs Not Available',
          message: 'You must enter MPR mode before enabling Crosshairs.',
          type: 'warning',
        });
      }
      return false;
    }

    if (viewportGridService && toolGroupService) {
      const activeViewportId = viewportGridService.getActiveViewportId();
      const activeToolGroup = toolGroupService.getToolGroupForViewport(activeViewportId);
      if (activeToolGroup !== 'mpr') {
        const viewports = viewportGridService.getState().viewports;
        for (const [viewportId] of viewports.entries()) {
          if (toolGroupService.getToolGroupForViewport(viewportId) === 'mpr') {
            this.commandsManager.runCommand('setViewportActive', { viewportId });
            break;
          }
        }
      }
    }

    this.commandsManager.runCommand('setToolActive', {
      toolName: 'Crosshairs',
      toolGroupId: 'mpr',
      ...(enabled ? {} : { toggledState: false }),
    });
    this.audit(enabled ? 'crosshairs_enabled' : 'crosshairs_disabled', {});
    
    return true;
  }

  private audit(action: string, metadata: any) {
    try {
      const displaySet = this.getActiveDisplaySet();
      const studyInstanceUid = displaySet ? displaySet.StudyInstanceUID : null;

      if (!studyInstanceUid) return;

      fetch('/api/audit/viewer-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyInstanceUid,
          action,
          metadata,
        }),
      }).catch(() => {});
    } catch (e) {
      // Ignore
    }
  }
}

export const viewerMprWorkflowService = new ViewerMprWorkflowService();
