'use client';

import { useState } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { createConsultationAction } from '@/app/consultations/actions';

interface ConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'DICOM' | 'NON_DICOM' | 'REPORT' | 'ARCHIVE';
  studyInstanceUid?: string;
  reportId?: string;
  nonDicomExamId?: string;
}

export function ConsultationDialog({ isOpen, onClose, sourceType, studyInstanceUid, reportId, nonDicomExamId }: ConsultationDialogProps) {
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Vui lòng nhập chủ đề hội chẩn");
      return;
    }
    
    setIsSubmitting(true);
    const res = await createConsultationAction({
      title,
      reason,
      priority,
      sourceType,
      studyInstanceUid,
      reportId,
      nonDicomExamId,
    });

    if (res.success) {
      alert('Đã tạo yêu cầu hội chẩn thành công!');
      onClose();
    } else {
      alert(res.error || 'Lỗi tạo hội chẩn');
    }
    setIsSubmitting(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-vin-border bg-vin-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-vin-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Users className="h-5 w-5 text-vin-accent" />
            Yêu cầu hội chẩn
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-vin-muted hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-vin-text2">Chủ đề <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Hội chẩn U gan"
                className="w-full rounded-md border border-vin-border bg-vin-shell px-3 py-2 text-sm text-white focus:border-vin-accent outline-none"
                required
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-vin-text2">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full rounded-md border border-vin-border bg-vin-shell px-3 py-2 text-sm text-white focus:border-vin-accent outline-none"
              >
                <option value="ROUTINE">Thường (Routine)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
                <option value="STAT">Tối khẩn (STAT)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-vin-text2">Ghi chú / Yêu cầu</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Nội dung cần hội chẩn..."
                className="h-24 w-full resize-none rounded-md border border-vin-border bg-vin-shell px-3 py-2 text-sm text-white focus:border-vin-accent outline-none"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-vin-muted hover:text-white"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-vin-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-vin-accentHover disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tạo yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
