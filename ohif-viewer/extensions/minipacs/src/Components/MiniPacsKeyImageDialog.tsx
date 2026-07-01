import React, { useState, useEffect } from 'react';
import { viewerKeyImageService } from '../services/viewerKeyImageService';
import { viewerAuditService } from '../services/viewerAuditService';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';

export const MiniPacsKeyImageDialog = ({ servicesManager, onClose }) => {
  const [viewportId, setViewportId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      if (e.detail?.dialogId === 'key-image') {
        setViewportId(e.detail.viewportId);
        setNote('');
        setIsOpen(true);
      }
    };
    window.addEventListener('minipacs:open-dialog', handleOpen as EventListener);
    return () => window.removeEventListener('minipacs:open-dialog', handleOpen as EventListener);
  }, []);

  if (!isOpen || !viewportId) return null;

  const handleSave = async () => {
    setIsOpen(false);
    const state = getMiniPacsViewportState(viewportId, servicesManager);
    const success = await viewerKeyImageService.saveKeyImage(viewportId, servicesManager, note);
    if (success) {
      viewerAuditService.recordAction(state.StudyInstanceUID, 'key_image_saved', { viewportId, note });
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#102126] border border-[#1A323A] rounded shadow-2xl p-4 w-[400px]">
        <h2 className="text-white text-lg font-semibold mb-4">Lưu Key Image</h2>
        <div className="mb-4">
          <label className="block text-[#8899A6] text-xs mb-1">Ghi chú (tuỳ chọn)</label>
          <textarea 
            className="w-full bg-[#0D1B20] text-white border border-[#1A323A] rounded p-2 text-sm focus:border-[#00B5B8] focus:outline-none resize-none h-[80px]"
            placeholder="Nhập ghi chú cho key image này..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            className="px-4 py-1.5 rounded text-white bg-[#1A323A] hover:bg-[#2A424A] text-sm transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Hủy
          </button>
          <button 
            className="px-4 py-1.5 rounded text-white bg-[#00B5B8] hover:bg-[#009598] text-sm transition-colors"
            onClick={handleSave}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
