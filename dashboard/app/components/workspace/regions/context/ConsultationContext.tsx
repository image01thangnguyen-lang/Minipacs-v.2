'use client';

import React, { useEffect, useState } from 'react';
import { getStudyConsultationsAction } from '@/app/consultations/actions';
import { ConsultationDialog } from '@/components/consultation/ConsultationDialog';
import { Users, Plus, MessageCircle } from 'lucide-react';

interface ConsultationContextProps {
  studyInstanceUid: string;
  patientName: string;
  canCreate: boolean;
}

export function ConsultationContext({ studyInstanceUid, patientName, canCreate }: ConsultationContextProps) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getStudyConsultationsAction(studyInstanceUid).then((res) => {
      if (mounted && res.success) {
        setConsultations(res.consultations);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [studyInstanceUid, showDialog]);

  return (
    <section aria-label="Consultations" className="mt-4 border border-vin-border rounded-md bg-vin-shell/30">
      <div className="flex items-center justify-between border-b border-vin-border bg-vin-shell px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-vin-accent flex items-center gap-1.5">
          <Users size={12} /> Hội chẩn
        </h3>
        {canCreate && (
          <button 
            onClick={() => setShowDialog(true)}
            className="text-[10px] flex items-center gap-1 font-medium text-vin-primary hover:text-vin-primary-hover"
            title="Tạo hội chẩn mới"
          >
            <Plus size={12} /> Mới
          </button>
        )}
      </div>
      
      <div className="p-3 flex flex-col gap-2">
        {loading ? (
          <div className="text-[11px] text-vin-muted text-center py-2">Đang tải...</div>
        ) : consultations.length === 0 ? (
          <div className="text-[11px] text-vin-muted text-center py-2">Không có hội chẩn</div>
        ) : (
          consultations.map(c => (
            <div key={c.id} className="text-[11px] bg-vin-panel border border-vin-border p-2 rounded">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-vin-text2 truncate">{c.title}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium
                  ${c.status === 'FINISHED' ? 'bg-green-500/10 text-green-500' : 'bg-vin-accent/10 text-vin-accent'}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="text-vin-muted text-[10px] flex items-center gap-1 mt-1.5">
                <MessageCircle size={10} /> 
                {c.participants?.length || 0} người tham gia
              </div>
            </div>
          ))
        )}
      </div>

      {showDialog && (
        <ConsultationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          sourceType="DICOM"
          studyInstanceUid={studyInstanceUid}
        />
      )}
    </section>
  );
}
