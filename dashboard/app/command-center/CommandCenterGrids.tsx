import React, { useMemo } from "react";
import Link from "next/link";
import { SharedDataGrid } from "../components/ui/data-grid/DataGrid";
import type { ColumnDef } from "../components/ui/shared-contracts";

interface QueueRow {
  id: string;
  orderId?: string | null;
  uid?: string | null;
  accessionNumber?: string | null;
  patientName?: string | null;
  priority?: string | null;
  status?: string | null;
  source: string;
}

interface SlaRow {
  id?: string;
  studyInstanceUid?: string | null;
  patientName?: string | null;
  stage: string;
  durationMinutes: number;
  thresholdMinutes: number;
  policyCode: string;
  source: string;
}

interface StuckRow {
  id: string;
  studyInstanceUid?: string | null;
  accessionNumber?: string | null;
  patientName?: string | null;
  status?: string | null;
  stuckSince: string | Date;
  hoursStuck: number;
}

interface AlertRow {
  id: string;
  title: string;
  message: string;
  severity: string;
  entityType?: string | null;
  createdAt: string | Date;
}

export function CommandCenterQueueGrid({ rows, isLoading }: { rows: QueueRow[]; isLoading: boolean }) {
  const columns = useMemo<ColumnDef<QueueRow>[]>(() => [
    {
      id: "accessionNumber",
      header: "Mã ca",
      width: 150,
      cell: (study) => (
        study.source === 'HIS' ? (
          <Link href={`/worklist?orderId=${study.orderId || study.id}`} className="font-semibold text-vin-accent hover:underline">
            {study.accessionNumber}
          </Link>
        ) : study.uid ? (
          <Link href={`/report/${study.uid}`} className="font-semibold text-vin-accent hover:underline">
            {study.accessionNumber}
          </Link>
        ) : (
          study.accessionNumber
        )
      ),
    },
    {
      id: "source",
      header: "Nguồn",
      width: 100,
      cell: (study) => (
        <span className={`rounded border px-2 py-1 text-xs font-medium ${study.source === 'HIS' ? 'border-vin-accent/40 bg-vin-accent/15 text-vin-accent' : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'}`}>
          {study.source}
        </span>
      ),
    },
    {
      id: "patientName",
      header: "Bệnh nhân",
      width: 200,
      cell: (study) => <span className="font-medium">{study.patientName}</span>,
    },
    {
      id: "priority",
      header: "Ưu tiên",
      width: 100,
      cell: (study) => study.priority,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 120,
      cell: (study) => study.status,
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={<div className="py-8 text-center text-vin-muted">Không có dữ liệu</div>}
      ariaLabel="Hàng đợi trực tiếp"
    />
  );
}

export function CommandCenterSlaGrid({ rows, isLoading }: { rows: SlaRow[]; isLoading: boolean }) {
  const columns = useMemo<ColumnDef<SlaRow>[]>(() => [
    {
      id: "patientName",
      header: "Bệnh nhân",
      width: 200,
      cell: (breach) => (
        breach.studyInstanceUid ? (
          <Link href={`/report/${breach.studyInstanceUid}`} className="font-semibold text-vin-accent hover:underline">
            {breach.patientName}
          </Link>
        ) : breach.patientName
      ),
    },
    {
      id: "stage",
      header: "Chặng (Stage)",
      width: 150,
      cell: (breach) => breach.stage,
    },
    {
      id: "duration",
      header: "Thời gian (phút)",
      width: 130,
      cell: (breach) => <span className="text-red-500 font-medium">{Math.round(breach.durationMinutes)}</span>,
    },
    {
      id: "threshold",
      header: "Ngưỡng",
      width: 100,
      cell: (breach) => breach.thresholdMinutes,
    },
    {
      id: "policy",
      header: "Policy",
      width: 180,
      cell: (breach) => (
        <>
          {breach.policyCode} <span className="text-xs text-vin-muted">({breach.source})</span>
        </>
      ),
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id || `${row.studyInstanceUid || "unknown"}:${row.stage}:${row.policyCode}`}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={<div className="py-8 text-center text-vin-muted">Không có dữ liệu</div>}
      ariaLabel="Danh sách vi phạm SLA"
    />
  );
}

export function CommandCenterStuckGrid({ rows, isLoading }: { rows: StuckRow[]; isLoading: boolean }) {
  const columns = useMemo<ColumnDef<StuckRow>[]>(() => [
    {
      id: "accessionNumber",
      header: "Mã ca",
      width: 150,
      cell: (study) => (
        study.studyInstanceUid ? (
          <Link href={`/report/${study.studyInstanceUid}`} className="font-semibold text-vin-accent hover:underline">
            {study.accessionNumber}
          </Link>
        ) : (
          <span className="text-vin-text">{study.accessionNumber}</span>
        )
      ),
    },
    {
      id: "patientName",
      header: "Bệnh nhân",
      width: 200,
      cell: (study) => <span className="font-medium">{study.patientName}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 120,
      cell: (study) => study.status,
    },
    {
      id: "stuckSince",
      header: "Bị kẹt từ lúc",
      width: 160,
      cell: (study) => new Date(study.stuckSince).toLocaleString(),
    },
    {
      id: "hoursStuck",
      header: "Thời gian kẹt (giờ)",
      width: 150,
      cell: (study) => <span className="font-medium text-orange-500">{study.hoursStuck}h</span>,
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={<div className="py-8 text-center text-vin-muted">Không có dữ liệu</div>}
      ariaLabel="Danh sách quy trình bị kẹt"
    />
  );
}

export function CommandCenterAlertsGrid({ rows, isLoading }: { rows: AlertRow[]; isLoading: boolean }) {
  const columns = useMemo<ColumnDef<AlertRow>[]>(() => [
    {
      id: "alert",
      header: "Cảnh báo",
      width: 300,
      cell: (alert) => (
        <>
          <div className="font-semibold">{alert.title}</div>
          <div className="max-w-md truncate text-xs text-vin-muted" title={alert.message}>{alert.message}</div>
        </>
      ),
    },
    {
      id: "severity",
      header: "Độ nghiêm trọng",
      width: 140,
      cell: (alert) => (
        <span className={`rounded border px-2 py-1 text-xs font-semibold ${alert.severity === 'CRITICAL' ? 'border-red-400/40 bg-vin-status-danger-bg/20 text-red-200' : 'border-amber-400/40 bg-vin-status-warning-bg/20 text-amber-100'}`}>
          {alert.severity}
        </span>
      ),
    },
    {
      id: "entityType",
      header: "Loại đối tượng",
      width: 140,
      cell: (alert) => <span className="text-vin-text2">{alert.entityType || 'SYSTEM'}</span>,
    },
    {
      id: "createdAt",
      header: "Thời gian",
      width: 160,
      cell: (alert) => <span className="text-vin-text2">{new Date(alert.createdAt).toLocaleString()}</span>,
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      renderLimit={150}
      emptyState={<div className="py-8 text-center text-vin-muted">Không có cảnh báo nào</div>}
      ariaLabel="Danh sách cảnh báo đang hoạt động"
    />
  );
}
