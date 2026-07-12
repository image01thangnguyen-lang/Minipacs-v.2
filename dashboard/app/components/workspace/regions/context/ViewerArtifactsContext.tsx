'use client';

import React, { useEffect, useState } from 'react';
import { getViewerArtifactsForReportAction } from '@/app/report/[studyInstanceUid]/actions';
import { Image as ImageIcon, Ruler } from 'lucide-react';

interface ViewerArtifactsContextProps {
  studyInstanceUid: string;
}

export function ViewerArtifactsContext({ studyInstanceUid }: ViewerArtifactsContextProps) {
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
    return <div className="mt-4 p-3 text-[11px] text-vin-muted text-center border border-vin-border rounded-md bg-vin-shell/30">Đang tải hình ảnh...</div>;
  }

  if (artifacts.keyImages.length === 0 && artifacts.measurements.length === 0) {
    return null; // Don't show if no artifacts
  }

  return (
    <section aria-label="Viewer Artifacts" className="mt-4 border border-vin-border rounded-md bg-vin-shell/30">
      <div className="flex items-center justify-between border-b border-vin-border bg-vin-shell px-3 py-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-vin-accent flex items-center gap-1.5">
          <ImageIcon size={12} /> Hình ảnh đính kèm
        </h3>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {artifacts.keyImages.length > 0 && (
          <div className="text-[11px]">
            <div className="font-semibold text-vin-text mb-1 flex items-center gap-1">
              <ImageIcon size={10} /> Key Images ({artifacts.keyImages.length})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {artifacts.keyImages.slice(0, 4).map((img, i) => (
                <div key={img.id || i} className="aspect-square bg-vin-sidebar border border-vin-border rounded overflow-hidden flex items-center justify-center relative group cursor-pointer hover:border-vin-primary transition-colors">
                  {/* Real implementation would load thumbnail blob via scoped endpoint or OHIF context */}
                  <span className="text-[9px] text-vin-muted group-hover:text-vin-primary">Key Image</span>
                </div>
              ))}
              {artifacts.keyImages.length > 4 && (
                <div className="text-[10px] text-vin-muted text-center col-span-2 pt-1">
                  + {artifacts.keyImages.length - 4} ảnh khác
                </div>
              )}
            </div>
          </div>
        )}

        {artifacts.keyImages.length > 0 && artifacts.measurements.length > 0 && (
          <hr className="my-1 border-vin-border" />
        )}

        {artifacts.measurements.length > 0 && (
          <div className="text-[11px]">
            <div className="font-semibold text-vin-text mb-1 flex items-center gap-1">
              <Ruler size={10} /> Measurements ({artifacts.measurements.length})
            </div>
            <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {artifacts.measurements.map(m => (
                <div key={m.id} className="text-[10px] bg-vin-panel p-1.5 border border-vin-border rounded truncate">
                  {m.toolName}: {m.value ? `${m.value} ${m.unit || ''}` : 'N/A'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
