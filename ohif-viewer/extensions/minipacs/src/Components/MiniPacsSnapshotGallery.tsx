import React, { useState, useEffect } from 'react';
import { SnapshotRecord, viewerSnapshotService } from '../services/viewerSnapshotService';
import { viewerAuditService } from '../services/viewerAuditService';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';
import { viewerApiClient } from '../services/viewerApiClient';

export const MiniPacsSnapshotGallery = ({ servicesManager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = async (e: CustomEvent) => {
      if (e.detail?.dialogId === 'gallery') {
        setIsOpen(true);
        setIsLoading(true);
        setErrorMsg(null);

        const { viewportGridService } = servicesManager.services;
        const state = getMiniPacsViewportState(viewportGridService.getActiveViewportId(), servicesManager);
        
        if (state.StudyInstanceUID) {
          viewerAuditService.recordAction(state.StudyInstanceUID, 'snapshot_opened');
          const res = await viewerApiClient.get<SnapshotRecord[]>(`/api/viewer/snapshots?studyInstanceUid=${state.StudyInstanceUID}`);
          if (res.ok && res.data) {
            setSnapshots(res.data);
          } else {
            setSnapshots([]);
            setErrorMsg(res.message || 'Không thể tải thư viện ảnh.');
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div className="bg-[#102126] border border-[#1A323A] rounded shadow-2xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#1A323A] bg-[#0D1B20]">
          <h2 className="text-white text-lg font-semibold tracking-wide">Thư viện Ảnh (Gallery)</h2>
          <button 
            className="text-[#8899A6] hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex content-start flex-wrap gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1A323A #102126' }}>
          {isLoading && <div className="text-center text-[#8899A6] w-full mt-8">Đang tải...</div>}
          {errorMsg && (
            <div className="text-center text-red-400 w-full mt-8 p-4 bg-red-900/20 border border-red-900/50 rounded">
              {errorMsg}
            </div>
          )}
          {!isLoading && !errorMsg && snapshots.length === 0 && (
            <div className="text-center text-[#8899A6] w-full mt-8">Chưa có ảnh nào được lưu trong thư viện.</div>
          )}
          
          {!isLoading && snapshots.map((record) => (
            <div key={record.id} className="w-[200px] bg-[#152A30] border border-[#1A323A] rounded overflow-hidden flex flex-col group">
              <div className="h-[150px] w-full bg-black flex items-center justify-center relative">
                {record.previewUrl ? (
                  <img src={record.previewUrl} alt="Snapshot Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-[#4A5B66] text-xs">No Preview</div>
                )}
              </div>
              <div className="p-2 flex flex-col bg-[#0D1B20]">
                <div className="text-white text-xs truncate" title={record.seriesDescription || 'No description'}>
                  {record.seriesDescription || 'Series'}
                </div>
                <div className="text-[#8899A6] text-[10px] mt-1 flex justify-between">
                  <span>Idx: {record.imageIndex}</span>
                  <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
