"use client";

import React, { useEffect, useState } from "react";
import { getStudyConsultationsAction } from "@/app/consultations/actions";
import { ConsultationDialog } from "@/components/consultation/ConsultationDialog";
import { TeamOutlined, PlusOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Tag, Typography, Spin } from "antd";

const { Text } = Typography;

interface ConsultationContextAntdProps {
  studyInstanceUid: string;
  patientName: string;
  canCreate: boolean;
}

export function ConsultationContextAntd({ studyInstanceUid, patientName, canCreate }: ConsultationContextAntdProps) {
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
    <section aria-label="Consultations" className="mt-4 border border-[#303030] rounded-md bg-[#1F1F1F]">
      <div className="flex items-center justify-between border-b border-[#303030] bg-[#141414] px-3 py-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#13C2C2] flex items-center gap-1.5">
          <TeamOutlined /> Hội chẩn
        </h3>
        {canCreate && (
          <Button
            type="link"
            size="middle"
            icon={<PlusOutlined />}
            onClick={() => setShowDialog(true)}
            className="text-sm font-medium text-cyan-400 p-0 h-auto"
            title="Tạo hội chẩn mới"
          >
            Mới
          </Button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-2"><Spin /></div>
        ) : consultations.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-2">Không có hội chẩn</div>
        ) : (
          consultations.map(c => (
            <div key={c.id} className="text-sm bg-[#141414] border border-[#303030] p-2 rounded">
              <div className="flex justify-between items-start mb-1">
                <Text className="font-semibold text-gray-300 truncate" style={{ maxWidth: '140px' }}>{c.title}</Text>
                <Tag color={c.status === 'FINISHED' ? 'success' : 'processing'} className="text-sm m-0 border-0 bg-opacity-20 font-medium">
                  {c.status}
                </Tag>
              </div>
              <div className="text-gray-500 text-sm flex items-center gap-1 mt-1.5">
                <MessageOutlined />
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
