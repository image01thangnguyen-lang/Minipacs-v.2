import { viewerApiClient } from './viewerApiClient';
import { commandFeedbackService } from './commandFeedbackService';

type ReportLinkResponse = {
  url: string;
  status: 'draft' | 'final' | 'none';
};

class ViewerReportBridge {
  async openReport(studyInstanceUid: string) {
    commandFeedbackService.show('Đang tải link báo cáo...', 'info', 1500);

    const result = await viewerApiClient.get<ReportLinkResponse>(`/api/viewer/studies/${studyInstanceUid}/report-link`);
    
    if (!result.ok) {
      commandFeedbackService.show(`Lỗi: ${result.message}`, 'warning');
      return;
    }

    if (result.data && result.data.url) {
      // Check if we should open in new tab or same tab depending on your app's workflow. 
      // Typically, a viewer might open the report editor in a new tab.
      window.open(result.data.url, '_blank');
    } else {
      commandFeedbackService.show('Chưa có báo cáo cho ca chụp này, hoặc URL không hợp lệ.', 'info');
    }
  }
}

export const viewerReportBridge = new ViewerReportBridge();
