import React, { useState, useEffect } from 'react';
import { StudyContext, viewerContextService } from '../services/viewerContextService';
import { viewerAuditService } from '../services/viewerAuditService';
import { viewerApiClient } from '../services/viewerApiClient';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';

type HistoryRecord = {
  studyInstanceUid: string;
  studyDate: string;
  modality: string;
  studyDescription: string;
  status: string;
  reportUrl?: string;
};

export const MiniPacsHistoryPanel = ({ servicesManager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = async (e: CustomEvent) => {
      if (e.detail?.dialogId === 'history') {
        setIsOpen(true);
        setIsLoading(true);
        setErrorMsg(null);

        const { viewportGridService } = servicesManager.services;
        const state = getMiniPacsViewportState(viewportGridService.getActiveViewportId(), servicesManager);
        
        if (state.StudyInstanceUID) {
          viewerAuditService.recordAction(state.StudyInstanceUID, 'history_opened');
          const res = await viewerApiClient.get<HistoryRecord[]>(`/api/viewer/studies/${state.StudyInstanceUID}/history`);
          if (res.ok && res.data) {
            setHistory(res.data);
          } else {
            setHistory([]);
            setErrorMsg(res.message || 'Không thể tải lịch sử khám.');
          }
        }
        setIsLoading(false);
      }
    };
    window.addEventListener('minipacs:open-dialog', handleOpen as EventListener);
    return () => window.removeEventListener('minipacs:open-dialog', handleOpen as EventListener);
  }, [servicesManager]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-[350px] bg-[#102126] border-l border-[#1A323A] shadow-2xl z-40 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-3 border-b border-[#1A323A] bg-[#0D1B20]">
        <h2 className="text-white text-sm font-semibold tracking-wide">Lịch sử khám (History)</h2>
        <button 
          className="text-[#8899A6] hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1A323A #102126' }}>
        {isLoading && <div className="text-center text-[#8899A6] mt-4 text-xs">Đang tải...</div>}
        {errorMsg && (
          <div className="text-center text-red-400 mt-4 text-xs p-2 bg-red-900/20 border border-red-900/50 rounded">
            {errorMsg}
          </div>
        )}
        {!isLoading && !errorMsg && history.length === 0 && (
          <div className="text-center text-[#8899A6] mt-4 text-xs">Không tìm thấy lịch sử khám.</div>
        )}
        
        {!isLoading && history.map((record) => (
          <div key={record.studyInstanceUid} className="mb-2 p-2 bg-[#152A30] border border-[#1A323A] rounded hover:border-[#00B5B8] transition-colors">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white font-medium">{record.studyDate}</span>
              <span className="text-[#00B5B8]">{record.modality}</span>
            </div>
            <div className="text-[#8899A6] text-xs truncate mb-2" title={record.studyDescription}>
              {record.studyDescription || 'Không có mô tả'}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${record.status === 'REPORTED' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {record.status}
              </span>
              {record.reportUrl && (
                <button 
                  className="text-[10px] text-white bg-[#00B5B8] hover:bg-[#009598] px-2 py-0.5 rounded transition-colors"
                  onClick={() => window.open(record.reportUrl, '_blank')}
                >
                  Xem KQ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
