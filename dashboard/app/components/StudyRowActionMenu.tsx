"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, FileText, UserPlus, FileEdit, FilePlus, XCircle, Unlock, CheckCircle2, Play, Download, Trash2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Link as LinkIcon, Users } from "lucide-react";

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
  canShare?: boolean;
  canConsult?: boolean;
  canExport?: boolean;
  canDeleteStudy?: boolean;
  canExportAnonymized?: boolean;
  onShare?: () => void;
  onConsult?: () => void;
  onExportDicom?: () => void;
  onExportAnonymized?: () => void;
  onRequestDelete?: () => void;
  allowedActions?: string[];
};

export function StudyRowActionMenu({
  studyInstanceUid,
  studyStatus,
  reportStatus,
  patientName,
  canReadReport: defaultCanReadReport,
  canWriteReport: defaultCanWriteReport,
  canAssign: defaultCanAssign,
  canUpdateClinical: defaultCanUpdateClinical,
  canCancelDraft: defaultCanCancelDraft,
  canUnfinalize: defaultCanUnfinalize,
  canDeliver: defaultCanDeliver,
  onAssignDoctor,
  onUpdateClinical,
  onAddIndication,
  onStartReading,
  onCancelDraft,
  onUnfinalize,
  onMarkDelivered,
  canShare: defaultCanShare,
  canConsult: defaultCanConsult,
  canExport: defaultCanExport,
  canDeleteStudy,
  canExportAnonymized,
  onShare,
  onConsult,
  onExportDicom,
  onExportAnonymized,
  onRequestDelete,
  allowedActions,
}: ActionMenuProps) {
  const canReadReport = allowedActions ? allowedActions.includes("readReport") : defaultCanReadReport;
  const canWriteReport = allowedActions ? allowedActions.includes("draftReport") : defaultCanWriteReport;
  const canAssign = allowedActions ? allowedActions.includes("assignCase") : defaultCanAssign;
  const canUpdateClinical = allowedActions ? allowedActions.includes("editClinical") : defaultCanUpdateClinical;
  const canCancelDraft = allowedActions ? allowedActions.includes("cancelDraft") : defaultCanCancelDraft;
  const canUnfinalize = allowedActions ? allowedActions.includes("unfinalizeReport") : defaultCanUnfinalize;
  const canDeliver = allowedActions ? allowedActions.includes("deliverResult") : defaultCanDeliver;
  const canShare = allowedActions ? allowedActions.includes("share") : defaultCanShare;
  const canConsult = allowedActions ? allowedActions.includes("createConsultation") : defaultCanConsult;
  const canExport = allowedActions ? allowedActions.includes("export") : defaultCanExport;

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

      {canShare && (
        <button
          onClick={() => handleAction(onShare)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <LinkIcon className="size-4 text-cyan-400" />
          Chia sẻ
        </button>
      )}

      {canConsult && (
        <button
          onClick={() => handleAction(onConsult)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <Users className="size-4 text-pink-400" />
          Hội chẩn
        </button>
      )}

      {canExport && (
        <button
          onClick={() => handleAction(onExportDicom)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <Download className="size-4 text-indigo-400" />
          Tải xuống DICOM
        </button>
      )}

      {canExportAnonymized && (
        <button
          onClick={() => handleAction(onExportAnonymized)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-vin-text transition hover:bg-white/5"
        >
          <ShieldAlert className="size-4 text-blue-400" />
          Tải xuống (Ẩn thông tin)
        </button>
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

      {canDeleteStudy && (
        <button
          onClick={() => handleAction(onRequestDelete)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 mt-1 border-t border-vin-border pt-1.5"
        >
          <Trash2 className="size-4" />
          Xóa Study
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
