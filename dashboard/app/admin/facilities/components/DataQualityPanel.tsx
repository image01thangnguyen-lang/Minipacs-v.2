"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { getDataQualityMetricsAction } from "../actions";

export function DataQualityPanel() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDataQualityMetricsAction();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-vin-muted" /></div>;
  }

  if (!metrics) {
    return <div className="text-red-400">Không thể tải thông tin chất lượng dữ liệu.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Unmapped Nodes */}
        <div className={`p-4 rounded-lg border shadow-sm ${metrics.unmappedNodesCount > 0 ? "border-amber-500/50 bg-amber-500/10" : "border-vin-border bg-vin-panel"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${metrics.unmappedNodesCount > 0 ? "bg-amber-500/20 text-amber-500" : "bg-vin-shell text-vin-muted"}`}>
              {metrics.unmappedNodesCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-medium text-vin-muted">Máy chưa ánh xạ</div>
              <div className={`text-2xl font-bold ${metrics.unmappedNodesCount > 0 ? "text-amber-500" : "text-white"}`}>
                {metrics.unmappedNodesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate AEs */}
        <div className={`p-4 rounded-lg border shadow-sm ${metrics.duplicateAeTitlesCount > 0 ? "border-red-500/50 bg-red-500/10" : "border-vin-border bg-vin-panel"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${metrics.duplicateAeTitlesCount > 0 ? "bg-red-500/20 text-red-500" : "bg-vin-shell text-vin-muted"}`}>
              {metrics.duplicateAeTitlesCount > 0 ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-medium text-vin-muted">Trùng AE Title</div>
              <div className={`text-2xl font-bold ${metrics.duplicateAeTitlesCount > 0 ? "text-red-500" : "text-white"}`}>
                {metrics.duplicateAeTitlesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Missing AEs */}
        <div className={`p-4 rounded-lg border shadow-sm ${metrics.missingAeTitleNodesCount > 0 ? "border-amber-500/50 bg-amber-500/10" : "border-vin-border bg-vin-panel"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${metrics.missingAeTitleNodesCount > 0 ? "bg-amber-500/20 text-amber-500" : "bg-vin-shell text-vin-muted"}`}>
              {metrics.missingAeTitleNodesCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div>
              <div className="text-sm font-medium text-vin-muted">Thiếu AE Title</div>
              <div className={`text-2xl font-bold ${metrics.missingAeTitleNodesCount > 0 ? "text-amber-500" : "text-white"}`}>
                {metrics.missingAeTitleNodesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Unclassified Orders */}
        <div className="p-4 rounded-lg border border-vin-border bg-vin-panel shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-vin-shell text-vin-muted">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-vin-muted">Chỉ định chưa phân loại</div>
              <div className="text-2xl font-bold text-white">
                {metrics.unclassifiedOrdersCount}
              </div>
            </div>
          </div>
        </div>

        {/* Unclassified Studies */}
        <div className="p-4 rounded-lg border border-vin-border bg-vin-panel shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-vin-shell text-vin-muted">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-vin-muted">Ca chụp chưa phân loại</div>
              <div className="text-2xl font-bold text-white">
                {metrics.unclassifiedStudiesCount}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="rounded-lg border border-vin-border bg-vin-panel p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Hướng dẫn xử lý</h3>
        <ul className="list-disc list-inside text-sm text-vin-muted space-y-1">
          <li><strong>Máy chưa ánh xạ:</strong> Chuyển sang tab "Máy chụp" và gắn đơn vị tổ chức cho các máy này. Ca chụp mới sẽ tự động thuộc về đơn vị đó.</li>
          <li><strong>Trùng/Thiếu AE Title:</strong> Kiểm tra cấu hình kết nối DICOM. Mỗi máy cần một AE Title duy nhất để đảm bảo phân quyền chính xác.</li>
          <li><strong>Ca chụp/Chỉ định chưa phân loại:</strong> Yêu cầu chạy script backfill hoặc mapper tự động để gán đơn vị tổ chức quá khứ.</li>
        </ul>
      </div>
    </div>
  );
}
