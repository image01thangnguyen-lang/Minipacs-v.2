import React, { useMemo } from "react";
import { SharedDataGrid } from "@/app/components/ui/data-grid/DataGrid";
import { ColumnDef } from "@/app/components/ui/shared-contracts";
import { Shield, ShieldCheck, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { type RoleProfile, type UserRow } from "./utils";
import { type SystemRole, roleLabels as systemRoleLabels } from "@/lib/permissions";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex max-w-[92px] justify-center truncate rounded px-2 py-0.5 text-sm font-bold ${
      active ? "bg-vin-status-approved-bg text-white" : "bg-vin-status-danger-bg text-white"
    }`}>
      {active ? "Đang dùng" : "Đã khóa"}
    </span>
  );
}

export function RoleBadge({ roleProfile, fallbackRole }: { roleProfile?: RoleProfile | null; fallbackRole?: string }) {
  const label = roleProfile?.name || (fallbackRole ? systemRoleLabels[fallbackRole as SystemRole] || fallbackRole : "Chưa gán");
  const role = roleProfile?.baseRole || fallbackRole;
  const classes = role === "ADMIN"
    ? "bg-amber-900/25 text-amber-200 border-amber-500/30"
    : role === "DOCTOR"
      ? "bg-vin-accentSoft/20 text-vin-accent border-vin-accent/40"
      : role === "TECHNICIAN"
        ? "bg-cyan-900/30 text-cyan-200 border-cyan-500/30"
        : "bg-emerald-900/25 text-emerald-200 border-emerald-500/30";

  return <span className={`inline-flex max-w-[150px] justify-center truncate rounded border px-1.5 py-px text-sm font-bold ${classes}`}>{label}</span>;
}

export function UsersDataGrid({
  rows,
  isLoading,
  selectedId,
  onSelect,
}: {
  rows: UserRow[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const columns = useMemo<ColumnDef<UserRow>[]>(() => [
    {
      id: "index",
      header: "TT",
      width: 60,
      align: "center",
      cell: (_, index) => <span className="font-mono text-vin-text">{index + 1}</span>,
    },
    {
      id: "username",
      header: "Username",
      width: 150,
      cell: (user) => (
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-vin-accent" />
          <span className="font-semibold text-white">{user.username}</span>
        </div>
      ),
    },
    {
      id: "fullName",
      header: "Họ tên",
      width: 200,
      cell: (user) => <div className="truncate">{user.fullName}</div>,
    },
    {
      id: "role",
      header: "Vai trò",
      width: 150,
      align: "center",
      cell: (user) => (
        <RoleBadge roleProfile={user.roleProfile} fallbackRole={user.role} />
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 120,
      align: "center",
      cell: (user) => <StatusBadge active={user.isActive} />,
    },
    {
      id: "createdAt",
      header: "Ngày tạo",
      width: 120,
      cell: (user) => (
        <span className="whitespace-nowrap font-mono text-vin-text2">
          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không tìm thấy người dùng nào.</div>}
      ariaLabel="Danh sách tài khoản"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}

export function RolesDataGrid({
  rows,
  isLoading,
  selectedId,
  onSelect,
}: {
  rows: RoleProfile[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const columns = useMemo<ColumnDef<RoleProfile>[]>(() => [
    {
      id: "index",
      header: "TT",
      width: 60,
      align: "center",
      cell: (_, index) => <span className="font-mono text-vin-text">{index + 1}</span>,
    },
    {
      id: "role",
      header: "Vai trò",
      width: 180,
      cell: (role) => (
        <div className="flex items-center gap-1.5">
          {role.isSystem ? <Lock className="h-3 w-3 text-amber-300" /> : <ShieldCheck className="h-3 w-3 text-vin-accent" />}
          <span className="font-semibold text-white">{role.name}</span>
        </div>
      ),
    },
    {
      id: "code",
      header: "Mã",
      width: 150,
      cell: (role) => <span className="font-mono text-vin-muted">{role.code}</span>,
    },
    {
      id: "baseRole",
      header: "Nhóm gốc",
      width: 150,
      align: "center",
      cell: (role) => <span>{systemRoleLabels[role.baseRole] || role.baseRole}</span>,
    },
    {
      id: "usersCount",
      header: "Users",
      width: 80,
      align: "center",
      cell: (role) => <span className="font-mono">{role._count?.users || 0}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 120,
      align: "center",
      cell: (role) => <StatusBadge active={role.isActive} />,
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyState={<div className="py-12 text-center text-vin-muted">Không tìm thấy vai trò nào.</div>}
      ariaLabel="Danh sách vai trò"
      onRowClick={(row) => onSelect(row.id)}
      selectedIds={selectedId ? [selectedId] : undefined}
    />
  );
}

export function ImportPreviewGrid({ rows }: { rows: any[] }) {
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "line",
      header: "Dòng",
      width: 60,
      align: "center",
      cell: (row) => <span className="font-mono text-vin-muted">{row.line}</span>,
    },
    {
      id: "username",
      header: "Username",
      width: 120,
      cell: (row) => row.username,
    },
    {
      id: "fullName",
      header: "Họ tên",
      width: 150,
      cell: (row) => row.fullName,
    },
    {
      id: "role",
      header: "Role",
      width: 150,
      cell: (row) => row.role,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: 120,
      cell: (row) => (
        row.success ? (
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Hợp lệ
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-400" title={row.error}>
            <AlertCircle className="h-3 w-3" /> {row.error}
          </div>
        )
      ),
    },
  ], []);

  return (
    <SharedDataGrid
      data={rows}
      columns={columns}
      getRowId={(row) => String(row.line ?? row.row ?? `${row.username}-${row.role}`)}
      isLoading={false}
      emptyState={<div className="py-4 text-center text-vin-muted">Không có dữ liệu import.</div>}
      ariaLabel="Import Preview"
    />
  );
}
