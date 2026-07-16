'use client';

import React, { useEffect, useState } from 'react';
import { getSecondReadsForStudyAction, createSecondReadAction } from '@/app/actions/second-read-actions';
import { ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

interface SecondReadContextProps {
  studyInstanceUid: string;
  canRequest: boolean;
}

export function SecondReadContext({ studyInstanceUid, canRequest }: SecondReadContextProps) {
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
      reason: 'Yêu cầu đọc chéo chất lượng',
    });
    if (res.success) {
      fetchSecondReads();
    } else {
      alert(res.error || 'Lỗi tạo Second Read');
    }
    setIsRequesting(false);
  };

  return (
    <section aria-label="Second Read" className="mt-4 border border-vin-border rounded-md bg-vin-shell/30">
      <div className="flex items-center justify-between border-b border-vin-border bg-vin-shell px-3 py-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-vin-accent flex items-center gap-1.5">
          <ShieldCheck size={12} /> Second Read
        </h3>
        {canRequest && (
          <button
            onClick={handleRequest}
            disabled={isRequesting || loading}
            className="text-sm flex items-center gap-1 font-medium text-vin-primary hover:text-vin-primary-hover disabled:opacity-50"
            title="Yêu cầu Second Read"
          >
            <Plus size={12} /> {isRequesting ? 'Đang gửi...' : 'Yêu cầu'}
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        {loading ? (
          <div className="text-sm text-vin-muted text-center py-2">Đang tải...</div>
        ) : secondReads.length === 0 ? (
          <div className="text-sm text-vin-muted text-center py-2">Chưa có yêu cầu</div>
        ) : (
          secondReads.map(sr => (
            <div key={sr.id} className="text-sm bg-vin-panel border border-vin-border p-2 rounded">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-vin-text2 truncate">
                  Yêu cầu bởi {sr.requestedByUser?.fullName || sr.requestedByUser?.username || 'Ẩn danh'}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-sm font-medium
                  ${sr.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-vin-accent/10 text-vin-accent'}`}
                >
                  {sr.status}
                </span>
              </div>
              <div className="text-vin-muted text-sm flex items-center gap-1 mt-1.5">
                <CheckCircle2 size={10} />
                {sr.assignedToUser ? `Gán cho: ${sr.assignedToUser.fullName}` : 'Chưa phân công'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
