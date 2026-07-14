"use client";

import React, { useEffect, useState } from "react";
import { getViewerArtifactsForReportAction } from "@/app/report/[studyInstanceUid]/actions";
import { PictureOutlined, ColumnHeightOutlined } from "@ant-design/icons";
import { Typography, Spin, Divider } from "antd";

const { Text } = Typography;

interface ViewerArtifactsContextAntdProps {
  studyInstanceUid: string;
}

export function ViewerArtifactsContextAntd({ studyInstanceUid }: ViewerArtifactsContextAntdProps) {
  const [artifacts, setArtifacts] = useState<{ measurements: any[], keyImages: any[] }>({ measurements: [], keyImages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getViewerArtifactsForReportAction(studyInstanceUid).then((res) => {
      if (mounted && res) {
        setArtifacts(res);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [studyInstanceUid]);

  if (loading) {
    return <div className="mt-4 p-3 text-[11px] text-gray-500 text-center border border-[#303030] rounded-md bg-[#1F1F1F]"><Spin size="small" /> Đang tải hình ảnh...</div>;
  }

  if (artifacts.keyImages.length === 0 && artifacts.measurements.length === 0) {
    return null; // Don't show if no artifacts
  }

  return (
    <section aria-label="Viewer Artifacts" className="mt-4 border border-[#303030] rounded-md bg-[#1F1F1F]">
      <div className="flex items-center justify-between border-b border-[#303030] bg-[#141414] px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#13C2C2] flex items-center gap-1.5">
          <PictureOutlined /> Hình ảnh đính kèm
        </h3>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {artifacts.keyImages.length > 0 && (
          <div className="text-[11px]">
            <div className="font-semibold text-gray-300 mb-1 flex items-center gap-1">
              <PictureOutlined /> Key Images ({artifacts.keyImages.length})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {artifacts.keyImages.slice(0, 4).map((img, i) => (
                <div key={img.id || i} className="aspect-square bg-[#141414] border border-[#303030] rounded overflow-hidden flex items-center justify-center relative group cursor-pointer hover:border-[#13C2C2] transition-colors">
                  <span className="text-[9px] text-gray-500 group-hover:text-cyan-400">Key Image</span>
                </div>
              ))}
              {artifacts.keyImages.length > 4 && (
                <div className="text-[10px] text-gray-500 text-center col-span-2 pt-1">
                  + {artifacts.keyImages.length - 4} ảnh khác
                </div>
              )}
            </div>
          </div>
        )}

        {artifacts.keyImages.length > 0 && artifacts.measurements.length > 0 && (
          <Divider className="my-1 border-[#303030]" />
        )}

        {artifacts.measurements.length > 0 && (
          <div className="text-[11px]">
            <div className="font-semibold text-gray-300 mb-1 flex items-center gap-1">
              <ColumnHeightOutlined /> Measurements ({artifacts.measurements.length})
            </div>
            <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {artifacts.measurements.map(m => (
                <div key={m.id} className="text-[10px] bg-[#141414] p-1.5 border border-[#303030] rounded truncate text-gray-400">
                  {m.toolName}: {m.value ? `${m.value} ${m.unit || ''}` : "N/A"}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
