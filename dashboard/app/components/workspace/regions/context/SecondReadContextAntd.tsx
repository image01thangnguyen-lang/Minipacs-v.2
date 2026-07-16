"use client";

import React, { useEffect, useState } from "react";
import { getSecondReadsForStudyAction, createSecondReadAction } from "@/app/actions/second-read-actions";
import { SafetyCertificateOutlined, PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { App, Button, Tag, Typography, Spin } from "antd";

const { Text } = Typography;

interface SecondReadContextAntdProps {
  studyInstanceUid: string;
  canRequest: boolean;
}

export function SecondReadContextAntd({ studyInstanceUid, canRequest }: SecondReadContextAntdProps) {
  const { message } = App.useApp();
  const [secondReads, setSecondReads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchSecondReads = () => {
    let mounted = true;
    const normalizedStudyInstanceUid = studyInstanceUid?.trim();
    if (!normalizedStudyInstanceUid) {
      setSecondReads([]);
      setLoading(false);
      return () => { mounted = false; };
    }
    setLoading(true);
    getSecondReadsForStudyAction(normalizedStudyInstanceUid).then((res) => {
      if (mounted && res.success) {
        setSecondReads(res.secondReads);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  };

  useEffect(() => {
    const cleanup = fetchSecondReads();
    return cleanup;
  }, [studyInstanceUid]);

  const handleRequest = async () => {
    const normalizedStudyInstanceUid = studyInstanceUid?.trim();
    if (!canRequest || isRequesting || !normalizedStudyInstanceUid) return;
    setIsRequesting(true);
    const res = await createSecondReadAction({
      studyInstanceUid: normalizedStudyInstanceUid,
      reason: "Yêu cầu đọc chéo chất lượng",
    });
    if (res.success) {
      fetchSecondReads();
      message.success("Đã yêu cầu Second Read");
    } else {
      message.error(res.error || "Lỗi tạo Second Read");
    }
    setIsRequesting(false);
  };

  return (
    <section aria-label="Second Read" className="mt-4 border border-[#303030] rounded-md bg-[#1F1F1F]">
      <div className="flex items-center justify-between border-b border-[#303030] bg-[#141414] px-3 py-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#13C2C2] flex items-center gap-1.5">
          <SafetyCertificateOutlined /> Second Read
        </h3>
        {canRequest && (
          <Button
            type="link"
            size="middle"
            icon={<PlusOutlined />}
            onClick={handleRequest}
            loading={isRequesting}
            disabled={loading}
            className="text-sm font-medium text-cyan-400 p-0 h-auto"
            title="Yêu cầu Second Read"
          >
            Yêu cầu
          </Button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-2"><Spin /></div>
        ) : secondReads.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-2">Chưa có yêu cầu</div>
        ) : (
          secondReads.map(sr => (
            <div key={sr.id} className="text-sm bg-[#141414] border border-[#303030] p-2 rounded">
              <div className="flex justify-between items-start mb-1">
                <Text className="font-semibold text-gray-300 truncate" style={{ maxWidth: '140px' }}>
                  Yêu cầu bởi {sr.requestedByUser?.fullName || sr.requestedByUser?.username || "Ẩn danh"}
                </Text>
                <Tag color={sr.status === "COMPLETED" ? "success" : "processing"} className="text-sm m-0 border-0 bg-opacity-20 font-medium">
                  {sr.status}
                </Tag>
              </div>
              <div className="text-gray-500 text-sm flex items-center gap-1 mt-1.5">
                <CheckCircleOutlined />
                {sr.assignedToUser ? `Gán cho: ${sr.assignedToUser.fullName}` : "Chưa phân công"}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
