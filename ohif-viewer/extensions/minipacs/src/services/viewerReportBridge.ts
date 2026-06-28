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
      // Create an absolute URL to ensure cookies (SameSite=Lax) are sent properly if on the same origin.
      const targetUrl = new URL(result.data.url, window.location.origin).toString();
      window.open(targetUrl, '_blank');
    } else {
      commandFeedbackService.show('Chưa có báo cáo cho ca chụp này, hoặc URL không hợp lệ.', 'info');
    }
  }
}

export const viewerReportBridge = new ViewerReportBridge();
