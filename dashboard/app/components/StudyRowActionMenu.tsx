"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, FileText, UserPlus, FileEdit, FilePlus, XCircle, Unlock, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";

type ActionMenuProps = {
  studyInstanceUid: string;
  studyStatus: string;
  reportStatus?: string;
  patientName: string;
  canReadReport: boolean;
  canWriteReport: boolean;
  canAssign: boolean;
  canUpdateClinical: boolean;
  canCancelDraft: boolean;
  canUnfinalize: boolean;
  canDeliver: boolean;
  
  onAssignDoctor?: () => void;
  onUpdateClinical?: () => void;
  onAddIndication?: () => void;
  onStartReading?: () => void;
  onCancelDraft?: () => void;
  onUnfinalize?: () => void;
  onMarkDelivered?: () => void;
};

export function StudyRowActionMenu({
  studyInstanceUid,
  studyStatus,
  reportStatus,
  patientName,
  canReadReport,
  canWriteReport,
  canAssign,
  canUpdateClinical,
  canCancelDraft,
  canUnfinalize,
  canDeliver,
  onAssignDoctor,
  onUpdateClinical,
  onAddIndication,
  onStartReading,
  onCancelDraft,
  onUnfinalize,
  onMarkDelivered,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        zIndex: 50,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleAction = (action?: () => void) => {
    setIsOpen(false);
    if (action) action();
  };

  const menu = isOpen ? createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-48 animate-in fade-in zoom-in-95 rounded-lg border border-vin-border bg-vin-shell py-1 shadow-lg shadow-black/20"
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-vin-muted">Hành động</div>

      <Link
        href={`/viewer/minipacs?StudyInstanceUIDs=${studyInstanceUid}`}
        target="_blank"
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        onClick={() => setIsOpen(false)}
      >
        <Eye className="size-4 text-vin-accent" />
        Mở Viewer
      </Link>

      {canReadReport && (
        <Link
          href={`/report/${studyInstanceUid}`}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
          onClick={() => setIsOpen(false)}
        >
          <FileText className="size-4 text-emerald-400" />
          Mở báo cáo
        </Link>
      )}

      {canWriteReport && studyStatus === "READY_TO_READ" && (
        <button
          onClick={() => handleAction(onStartReading)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <Play className="size-4 text-blue-400" />
          Nhận đọc
        </button>
      )}

      {canAssign && (
        <button
          onClick={() => handleAction(onAssignDoctor)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <UserPlus className="size-4 text-amber-400" />
          Gán bác sĩ
        </button>
      )}

      {canUpdateClinical && (
        <>
          <button
            onClick={() => handleAction(onUpdateClinical)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
          >
            <FileEdit className="size-4 text-indigo-400" />
            Cập nhật lâm sàng
          </button>
          <button
            onClick={() => handleAction(onAddIndication)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
          >
            <FilePlus className="size-4 text-pink-400" />
            Thêm chỉ định
          </button>
        </>
      )}

      {canCancelDraft && (reportStatus === "DRAFT" || reportStatus === "PENDING_APPROVAL") && (
        <button
          onClick={() => handleAction(onCancelDraft)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          <XCircle className="size-4" />
          Hủy phiếu
        </button>
      )}

      {canUnfinalize && reportStatus === "FINAL" && (
        <button
          onClick={() => handleAction(onUnfinalize)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-amber-400 transition hover:bg-amber-500/10"
        >
          <Unlock className="size-4" />
          Hủy duyệt
        </button>
      )}

      {canDeliver && studyStatus === "FINALIZED" && (
        <button
          onClick={() => handleAction(onMarkDelivered)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-emerald-400 transition hover:bg-emerald-500/10"
        >
          <CheckCircle2 className="size-4" />
          Ghi nhận đã trả
        </button>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-7 items-center justify-center rounded bg-vin-shell hover:bg-white/10"
        title="Thao tác"
      >
        <MoreHorizontal className="size-4 text-vin-text2" />
      </button>
      {menu}
    </>
  );
}
