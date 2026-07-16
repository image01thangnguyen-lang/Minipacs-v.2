import React, { useEffect, useRef, useState } from "react";
import { Clock, Loader2, Eye, SplitSquareHorizontal } from "lucide-react";
import { getRelatedStudiesAction } from "../../../actions/related-studies-actions";
import { WorklistRow } from "../../../../lib/worklist/contract";
import { fmtDateTimeIso, fmtText } from "../formatters";
import { ModBadge } from "../badges";
import type { RelatedStudyRange } from "../../../../lib/workspace/related-studies-range";

interface RelatedStudiesPanelProps {
  anchorStudyUid?: string;
  selectedUid?: string;
  onSelect?: (study: any) => void;
  onDoubleClick?: (study: any) => void;
  onCompare?: (study: any) => void;
}

export function RelatedStudiesPanel({
  anchorStudyUid,
  selectedUid,
  onSelect,
  onDoubleClick,
  onCompare,
}: RelatedStudiesPanelProps) {
  const [history, setHistory] = useState<WorklistRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RelatedStudyRange>("ALL");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const requestRaceToken = useRef<string | null>(null);

  useEffect(() => {
    if (!anchorStudyUid) {
      setHistory([]);
      setError(null);
      setIsLoading(false);
      setFocusedIndex(-1);
      return;
    }

    const currentToken = `${anchorStudyUid}|${range}`;
    requestRaceToken.current = currentToken;
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRelatedStudiesAction({ anchorStudyUid, range });
        if (!isMounted || requestRaceToken.current !== currentToken) return;
        setHistory(result.rows || []);
        setFocusedIndex(-1); // Reset focus when data changes
      } catch (err: any) {
        if (!isMounted || requestRaceToken.current !== currentToken) return;
        setError(err.message || "Lỗi tải lịch sử");
        setHistory([]);
      } finally {
        if (isMounted && requestRaceToken.current === currentToken) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [anchorStudyUid, range]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (history.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, history.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < history.length) {
        const row = history[focusedIndex];
        const legacyHistoryObject = {
          ...row,
          MainDicomTags: { StudyInstanceUID: row.studyInstanceUid },
        };
        onSelect?.(legacyHistoryObject);
      }
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0) rowRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  return (
    <div
      className="flex h-full flex-col bg-vin-sidebar focus:outline-none focus:ring-1 focus:ring-inset focus:ring-vin-accent"
    >
      <div className="flex items-center justify-between border-b border-vin-border px-3 py-1.5 bg-vin-panel2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-vin-accent" />
          <span className="text-sm font-bold uppercase tracking-wider text-vin-muted">Lịch sử chụp</span>
          {history.length > 0 && (
            <span className="font-mono text-sm text-vin-faint">
              · {history.length} ca liên quan
            </span>
          )}
        </div>

        {/* Range Switcher */}
        {anchorStudyUid && (
          <div className="flex bg-vin-shell rounded border border-vin-border p-0.5" role="group" aria-label="Khoảng thời gian lịch sử">
            {[
              { label: "Đợt khám", value: "ENCOUNTER" },
              { label: "30 Ngày", value: "30D" },
              { label: "1 Năm", value: "1Y" },
              { label: "Tất cả", value: "ALL" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={range === opt.value}
                onClick={() => setRange(opt.value as RelatedStudyRange)}
                className={`px-2 py-0.5 text-sm font-medium rounded-sm transition-colors ${
                  range === opt.value
                    ? "bg-vin-panel text-vin-text shadow-sm"
                    : "text-vin-muted hover:text-vin-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[calc(100%-34px)] overflow-auto scr-dark relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-vin-sidebar/50">
            <Loader2 className="h-4 w-4 animate-spin text-vin-accent" />
          </div>
        )}

        {!anchorStudyUid ? (
          <div className="flex h-full items-center justify-center text-sm text-vin-faint">
            Chọn một bệnh nhân để xem lịch sử chụp
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-vin-alert">
            {error}
          </div>
        ) : history.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-vin-faint">Không có lịch sử trong khoảng thời gian này</div>
        ) : (
          <table className="w-full text-left" aria-label="Các ca chụp liên quan">
            <thead className="sticky top-0 z-10 border-b border-white/10 bg-vin-panel2 text-sm font-semibold uppercase tracking-wider text-vin-muted">
              <tr>
                <th className="py-1 pl-2 pr-1">Ngày chụp</th>
                <th className="w-10 px-1 py-1 text-center">Mod</th>
                <th className="px-1 py-1">Mô tả</th>
                <th className="w-8 py-1 pl-1 pr-1 text-center">TT</th>
                <th className="w-16 py-1 pr-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {history.map((row, idx) => {
                const uid = row.studyInstanceUid;
                const isCurrent = uid === selectedUid;
                const isFocused = idx === focusedIndex;
                const isStable = row.status === "FINALIZED" || row.status === "DELIVERED";

                const legacyHistoryObject = {
                  ...row,
                  MainDicomTags: {
                    StudyInstanceUID: uid,
                  }
                };

                const canReadStudy = row.allowedActions?.includes("readStudy");

                return (
                  <tr
                    key={row.id}
                    ref={element => { rowRefs.current[idx] = element; }}
                    tabIndex={isFocused || (focusedIndex < 0 && idx === 0) ? 0 : -1}
                    aria-selected={isCurrent}
                    onKeyDown={handleKeyDown}
                    onClick={() => {
                      setFocusedIndex(idx);
                      onSelect?.(legacyHistoryObject);
                    }}
                    onDoubleClick={() => onDoubleClick?.(legacyHistoryObject)}
                    className={`cursor-pointer border-b border-white/5 transition-colors last:border-b-0 ${
                      isCurrent
                        ? "bg-vin-tableSelected text-white"
                        : isFocused
                          ? "bg-vin-tableHover/50 text-white"
                          : "text-vin-text2 hover:bg-vin-tableHover"
                    }`}
                  >
                    <td className="whitespace-nowrap py-1 pl-2 pr-1 font-mono">
                      {fmtDateTimeIso(row.createdAt)}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <ModBadge value={row.modality || "?"} />
                    </td>
                    <td className="max-w-[200px] truncate px-1 py-1">{fmtText(row.bodyPart || row.patientName)}</td>
                    <td className="py-1 pl-1 pr-1 text-center">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${isStable ? "bg-emerald-400" : "bg-amber-400"}`} />
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={!canReadStudy}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canReadStudy) onDoubleClick?.(legacyHistoryObject);
                          }}
                          className={`p-1 rounded ${canReadStudy ? "text-vin-faint hover:text-white hover:bg-white/10" : "text-white/10 cursor-not-allowed"}`}
                          title={canReadStudy ? "Mở Viewer" : "Bạn không có quyền xem ca này"}
                          aria-label={canReadStudy ? "Mở ca trong Viewer" : "Không có quyền mở ca trong Viewer"}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={!canReadStudy || !onCompare}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canReadStudy) onCompare?.(legacyHistoryObject);
                          }}
                          className={`p-1 rounded ${canReadStudy && onCompare ? "text-vin-faint hover:text-white hover:bg-white/10" : "text-white/10 cursor-not-allowed"}`}
                          title={!canReadStudy ? "Bạn không có quyền xem ca này" : onCompare ? "So sánh ca này" : "Chức năng so sánh chưa khả dụng"}
                          aria-label={!canReadStudy ? "Không có quyền so sánh ca" : onCompare ? "So sánh ca này" : "Chức năng so sánh chưa khả dụng"}
                        >
                          <SplitSquareHorizontal className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
