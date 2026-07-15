"use client";

import React, { useEffect, useRef, useState } from "react";
import { ClockCircleOutlined, EyeOutlined, CompressOutlined } from "@ant-design/icons";
import { Spin, Radio, Table, Tooltip, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getRelatedStudiesAction } from "../../../actions/related-studies-actions";
import { WorklistRow } from "../../../../lib/worklist/contract";
import { fmtDateTimeIso, fmtText } from "../formatters";
import { ModBadge } from "../badges";
import type { RelatedStudyRange } from "../../../../lib/workspace/related-studies-range";

interface RelatedStudiesPanelAntdProps {
  anchorStudyUid?: string;
  selectedUid?: string;
  onSelect?: (study: any) => void;
  onDoubleClick?: (study: any) => void;
  onCompare?: (study: any) => void;
}

export function RelatedStudiesPanelAntd({
  anchorStudyUid,
  selectedUid,
  onSelect,
  onDoubleClick,
  onCompare,
}: RelatedStudiesPanelAntdProps) {
  const [history, setHistory] = useState<WorklistRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RelatedStudyRange>("ALL");
  
  // Track focused index for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);

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
        const result = await getRelatedStudiesAction({ anchorStudyUid: anchorStudyUid as string, range });
        if (!isMounted || requestRaceToken.current !== currentToken) return;
        setHistory(result.rows || []);
        setFocusedIndex(-1);
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

  const columns: ColumnsType<WorklistRow> = [
    {
      title: "Ngày chụp",
      key: "date",
      width: 70,
      render: (_: any, row: WorklistRow) => (
        <span className="whitespace-nowrap font-mono">
          {fmtDateTimeIso(row.createdAt)}
        </span>
      )
    },
    {
      title: "Mod",
      key: "modality",
      align: "center",
      width: 40,
      render: (_: any, row: WorklistRow) => <ModBadge value={row.modality || "?"} />
    },
    {
      title: "Mô tả",
      key: "description",
      render: (_: any, row: WorklistRow) => (
        <span className="max-w-[150px] truncate block" title={fmtText(row.bodyPart || row.patientName)}>
          {fmtText(row.bodyPart || row.patientName)}
        </span>
      )
    },
    {
      title: "TT",
      key: "status",
      align: "center",
      width: 30,
      render: (_: any, row: WorklistRow) => {
        const isStable = row.status === "FINALIZED" || row.status === "DELIVERED";
        return (
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isStable ? "bg-emerald-400" : "bg-amber-400"}`} />
        );
      }
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 60,
      render: (_: any, row: WorklistRow) => {
        const legacyHistoryObject = {
          ...row,
          MainDicomTags: { StudyInstanceUID: row.studyInstanceUid }
        };
        const canReadStudy = row.allowedActions?.includes("readStudy");

        return (
          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
            <Tooltip title={canReadStudy ? "Mở Viewer" : "Bạn không có quyền xem ca này"}>
              <Button
                type="text"
                size="middle"
                disabled={!canReadStudy}
                icon={<EyeOutlined />}
                onClick={() => {
                  if (canReadStudy) onDoubleClick?.(legacyHistoryObject);
                }}
                className={`text-[10px] h-6 w-6 p-0 ${canReadStudy ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
              />
            </Tooltip>
            <Tooltip title={!canReadStudy ? "Bạn không có quyền xem ca này" : onCompare ? "So sánh ca này" : "Chức năng so sánh chưa khả dụng"}>
              <Button
                type="text"
                size="middle"
                disabled={!canReadStudy || !onCompare}
                icon={<CompressOutlined />}
                onClick={() => {
                  if (canReadStudy) onCompare?.(legacyHistoryObject);
                }}
                className={`text-[10px] h-6 w-6 p-0 ${canReadStudy && onCompare ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
              />
            </Tooltip>
          </div>
        );
      }
    }
  ];

  return (
    <div className="flex h-full flex-col bg-[#141414] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#13C2C2]">
      <div className="flex items-center justify-between border-b border-[#303030] px-3 py-1.5 bg-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-[#13C2C2]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lịch sử chụp</span>
          {history.length > 0 && (
            <span className="font-mono text-[10px] text-gray-500">
              · {history.length} ca liên quan
            </span>
          )}
        </div>

        {anchorStudyUid && (
          <Radio.Group
            size="middle"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="flex"
            buttonStyle="solid"
          >
            <Radio.Button value="ENCOUNTER" className="text-[9px] px-2 leading-[20px] h-[22px]">Đợt khám</Radio.Button>
            <Radio.Button value="30D" className="text-[9px] px-2 leading-[20px] h-[22px]">30 Ngày</Radio.Button>
            <Radio.Button value="1Y" className="text-[9px] px-2 leading-[20px] h-[22px]">1 Năm</Radio.Button>
            <Radio.Button value="ALL" className="text-[9px] px-2 leading-[20px] h-[22px]">Tất cả</Radio.Button>
          </Radio.Group>
        )}
      </div>

      <div className="h-[calc(100%-34px)] relative overflow-hidden flex flex-col">
        {!anchorStudyUid ? (
          <div className="flex h-full items-center justify-center text-[11px] text-gray-500">
            Chọn một bệnh nhân để xem lịch sử chụp
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-[11px] text-red-400">
            {error}
          </div>
        ) : history.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center text-[11px] text-gray-500">
            Không có lịch sử trong khoảng thời gian này
          </div>
        ) : (
          <Table
            className="flex-1"
            size="middle"
            loading={{
              spinning: isLoading,
              indicator: <Spin />
            }}
            dataSource={history}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ y: "calc(100vh - 400px)" }}
            rowClassName={(record, index) => {
              const uid = record.studyInstanceUid;
              const isCurrent = uid === selectedUid;
              const isFocused = index === focusedIndex;
              if (isCurrent) return "bg-[#13C2C2] text-white";
              if (isFocused) return "bg-[#262626] text-white";
              return "cursor-pointer text-gray-300 hover:bg-[#262626]";
            }}
            onRow={(record, index) => ({
              onClick: () => {
                setFocusedIndex(index ?? -1);
                onSelect?.({
                  ...record,
                  MainDicomTags: { StudyInstanceUID: record.studyInstanceUid }
                });
              },
              onDoubleClick: () => {
                onDoubleClick?.({
                  ...record,
                  MainDicomTags: { StudyInstanceUID: record.studyInstanceUid }
                });
              },
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSelect?.({
                    ...record,
                    MainDicomTags: { StudyInstanceUID: record.studyInstanceUid }
                  });
                } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const delta = e.key === 'ArrowDown' ? 1 : -1;
                  const nextIndex = Math.max(0, Math.min(history.length - 1, (index ?? 0) + delta));
                  setFocusedIndex(nextIndex);
                  
                  // Simple focus management, rely on tabIndex or browser focus
                  const rows = document.querySelectorAll('.ant-table-row');
                  if (rows[nextIndex]) {
                    (rows[nextIndex] as HTMLElement).focus();
                  }
                }
              },
              tabIndex: (index === focusedIndex || (focusedIndex < 0 && index === 0)) ? 0 : -1,
            })}
          />
        )}
      </div>
    </div>
  );
}
