import { annotation, Enums } from '@cornerstonejs/tools';
import { eventTarget } from '@cornerstonejs/core';
import { ServicesManager } from '@ohif/core';
import { commandFeedbackService } from './commandFeedbackService';

class ViewerMeasurementPersistenceService {
  private servicesManager: ServicesManager | null = null;
  private isHydrating = false;
  private studyInstanceUid: string = '';
  private debounceTimers: Record<string, NodeJS.Timeout> = {};

  initialize(servicesManager: ServicesManager) {
    this.servicesManager = servicesManager;
    const { measurementService } = servicesManager.services;
    const { MEASUREMENT_ADDED, MEASUREMENT_UPDATED, MEASUREMENT_REMOVED } = measurementService.EVENTS;

    measurementService.subscribe(MEASUREMENT_ADDED, this.onMeasurementAdded.bind(this));
    measurementService.subscribe(MEASUREMENT_UPDATED, this.onMeasurementUpdated.bind(this));
    measurementService.subscribe(MEASUREMENT_REMOVED, this.onMeasurementRemoved.bind(this));
  }

  async loadForStudy(studyInstanceUid: string) {
    if (!this.servicesManager) return;
    
    this.studyInstanceUid = studyInstanceUid;
    this.isHydrating = true;
    try {
      const res = await fetch(`/api/viewer/studies/${studyInstanceUid}/measurements`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          this.servicesManager.services.uiNotificationService.show({
            title: 'Permission Denied',
            message: 'Failed to load measurements (unauthorized).',
            type: 'error',
          });
        }
        return;
      }

      const data = await res.json();
      const annotationManager = annotation.state.getAnnotationManager();

      data.forEach((record: any) => {
        if (!record.data || !record.data.annotationUID) return;
        const rawAnnotation = record.data;

        // Make sure it doesn't already exist to prevent duplicates
        if (annotationManager.getAnnotation(rawAnnotation.annotationUID)) {
          return;
        }

        // Ignore annotations from MPR/volumes lacking explicit SOPInstanceUID mapping
        if (!record.sopInstanceUid) {
          return;
        }

        // Add to cornerstone
        annotationManager.addAnnotation(rawAnnotation);

        // Tell cornerstone tools so OHIF picks it up
        eventTarget.dispatchEvent(
          new CustomEvent(Enums.Events.ANNOTATION_ADDED, {
            detail: {
              annotation: rawAnnotation,
            },
          })
        );
      });
    } catch (e) {
      console.error('Failed to load viewer measurements', e);
    } finally {
      this.isHydrating = false;
    }
  }

  private onMeasurementAdded({ measurement }: any) {
    if (this.isHydrating || !this.studyInstanceUid) return;

    const rawAnnotation = annotation.state.getAnnotation(measurement.uid);
    if (!rawAnnotation) return;

    if (!measurement.SOPInstanceUID) {
      // Defer MPR measurement persistence to avoid mapping crashes upon reload
      console.warn('Measurement lacks SOPInstanceUID (likely from MPR). Skipping persistence.');
      return;
    }

    if (measurement.unit === 'px' || (measurement.displayText && Array.isArray(measurement.displayText) && measurement.displayText.some((t: string) => t.includes('px')))) {
      commandFeedbackService.show('Cảnh báo: Ảnh chưa được hiệu chuẩn (pixel spacing bị thiếu). Đo đạc có thể không chính xác.', 'warning');
    }

    fetch(`/api/viewer/studies/${this.studyInstanceUid}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studyInstanceUid: this.studyInstanceUid,
        seriesInstanceUid: measurement.referenceSeriesUID,
        sopInstanceUid: measurement.SOPInstanceUID,
        frameNumber: rawAnnotation.data?.frameNumber,
        toolName: measurement.toolName || rawAnnotation.metadata?.toolName,
        measurementType: measurement.type,
        annotationUID: measurement.uid,
        measurementUID: measurement.uid,
        label: measurement.label,
        displayText: Array.isArray(measurement.displayText) ? measurement.displayText.join(', ') : (measurement.displayText || null),
        value: typeof measurement.value === 'number' ? measurement.value : null,
        unit: measurement.unit,
        data: rawAnnotation,
      })
    }).catch(console.error);
  }

  private onMeasurementUpdated({ measurement }: any) {
    if (this.isHydrating || !this.studyInstanceUid) return;

    const uid = measurement.uid;
    if (this.debounceTimers[uid]) clearTimeout(this.debounceTimers[uid]);

    this.debounceTimers[uid] = setTimeout(() => {
      const rawAnnotation = annotation.state.getAnnotation(uid);
      if (!rawAnnotation) return;

      if (!measurement.SOPInstanceUID) {
        return;
      }

      fetch(`/api/viewer/studies/${this.studyInstanceUid}/measurements/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: measurement.label,
          displayText: Array.isArray(measurement.displayText) ? measurement.displayText.join(', ') : (measurement.displayText || null),
          value: typeof measurement.value === 'number' ? measurement.value : null,
          unit: measurement.unit,
          data: rawAnnotation,
        })
      }).catch(console.error);
    }, 1000);
  }

  private onMeasurementRemoved({ measurement }: any) {
    if (this.isHydrating || !this.studyInstanceUid) return;
    
    // In OHIF, measurement in MEASUREMENT_REMOVED is the ID string
    const uid = typeof measurement === 'string' ? measurement : measurement.uid;

    if (this.debounceTimers[uid]) {
      clearTimeout(this.debounceTimers[uid]);
      delete this.debounceTimers[uid];
    }

    fetch(`/api/viewer/studies/${this.studyInstanceUid}/measurements/${uid}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export const viewerMeasurementPersistenceService = new ViewerMeasurementPersistenceService();
