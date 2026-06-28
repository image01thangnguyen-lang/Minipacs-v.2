import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';

export type StudyContext = {
  patientName?: string;
  patientId?: string;
  accessionNumber?: string;
  studyStatus?: string;
  reportStatus?: string;
  assignedDoctor?: string;
  previousStudyCount?: number;
};

class ViewerContextService {
  private contextCache: Record<string, StudyContext> = {};

  async loadContext(studyInstanceUid: string): Promise<StudyContext | null> {
    if (this.contextCache[studyInstanceUid]) {
      return this.contextCache[studyInstanceUid];
    }

    const result = await viewerApiClient.get<StudyContext>(`/api/viewer/studies/${studyInstanceUid}/context`);
    
    if (!result.ok) {
      console.warn(`[ViewerContextService] Failed to load context for ${studyInstanceUid}:`, result.message);
      // We don't block or show a disruptive toast here, just log or show a silent indicator if needed.
      return null;
    }

    if (result.data) {
      this.contextCache[studyInstanceUid] = result.data;
      return result.data;
    }

    return null;
  }

  getContext(studyInstanceUid: string): StudyContext | undefined {
    return this.contextCache[studyInstanceUid];
  }
}

export const viewerContextService = new ViewerContextService();
