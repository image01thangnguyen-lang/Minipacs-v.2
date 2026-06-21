"use client";

import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  Shield,
  Upload,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { createUserAction, getUsersForAdmin, updateUserAction } from "./actions";
import {
  getPermissionsForRole,
  permissionGroups,
  permissionLabels,
  roleDescriptions,
  type AppRole,
} from "@/lib/permissions";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "KTV",
  RECEPTION: "Lễ tân",
};

function RoleBadge({ role }: { role: string }) {
  const classes =
    role === "ADMIN"
      ? "bg-amber-900/25 text-amber-200 border-amber-500/30"
      : role === "DOCTOR"
        ? "bg-vin-accentSoft/20 text-vin-accent border-vin-accent/40"
        : role === "TECHNICIAN"
          ? "bg-cyan-900/30 text-cyan-200 border-cyan-500/30"
          : "bg-emerald-900/25 text-emerald-200 border-emerald-500/30";

  return (
    <span className={`inline-flex min-w-[48px] justify-center rounded border px-1.5 py-px text-[10px] font-bold ${classes}`}>
      {roleLabels[role] || role}
    </span>
  );
}

function RolePermissionSummary({ role }: { role: AppRole }) {
  const permissions = new Set(getPermissionsForRole(role));

  return (
    <section className="rounded border border-vin-border bg-vin-shell px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">Phân quyền theo vai trò</div>
          <div className="mt-1 text-sm font-bold text-white">{roleLabels[role] || role}</div>
          <div className="mt-0.5 text-[11px] leading-relaxed text-vin-muted">{roleDescriptions[role]}</div>
        </div>
        <RoleBadge role={role} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {permissionGroups.map(group => {
          const active = group.permissions.filter(permission => permissions.has(permission));
          if (active.length === 0) return null;

          return (
            <div key={group.title} className="rounded border border-vin-border/70 bg-vin-panel px-2.5 py-2">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-vin-muted">{group.title}</div>
              <div className="grid grid-cols-1 gap-1.5">
                {active.map(permission => (
                  <div key={permission} className="flex items-center gap-1.5 text-[11px] text-vin-text2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>{permissionLabels[permission]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PermissionMatrix() {
  const roles = Object.keys(roleDescriptions) as AppRole[];

  return (
    <section className="rounded border border-vin-border bg-vin-shell p-3 text-left">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Ma trận quyền</div>
      <div className="max-h-72 overflow-auto scr-dark">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-vin-shell text-vin-muted">
            <tr>
              <th className="py-1.5 pr-2 text-left">Quyền</th>
              {roles.map(role => (
                <th key={role} className="px-1.5 py-1.5 text-center">{roleLabels[role] || role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vin-border/50">
            {permissionGroups.flatMap(group => group.permissions).map(permission => (
              <tr key={permission}>
                <td className="py-1.5 pr-2 text-vin-text2">{permissionLabels[permission]}</td>
                {roles.map(role => (
                  <td key={`${role}-${permission}`} className="px-1.5 py-1.5 text-center">
                    {getPermissionsForRole(role).includes(permission) ? (
                      <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <span className="text-vin-faint">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex max-w-[80px] justify-center truncate rounded px-2 py-0.5 text-[9px] font-bold ${
        active
          ? "bg-vin-status-approved-bg text-white"
          : "bg-vin-status-danger-bg text-white"
      }`}
    >
      {active ? "Đang dùng" : "Đã khóa"}
    </span>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "create">("view");
  const [isSaving, setIsSaving] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [createRole, setCreateRole] = useState<AppRole>("DOCTOR");
  const [editRole, setEditRole] = useState<AppRole>("DOCTOR");

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsersForAdmin();
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Quản lý người dùng";
  }, []);

  const filteredUsers = searchQuery.trim()
    ? users.filter(u =>
        `${u.username} ${u.fullName} ${roleLabels[u.role] || u.role}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : users;

  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  useEffect(() => {
    if (selectedUser?.role) {
      setEditRole(selectedUser.role as AppRole);
    }
  }, [selectedUser?.id, selectedUser?.role]);

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createUserAction(formData);
      await loadUsers();
      setMode("view");
      setCreateRole("DOCTOR");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateUserAction(formData);
      await loadUsers();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const isDoctor = editRole === "DOCTOR";
  const profile = selectedUser?.doctorProfile;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="users" />

      {/* Left Panel — User Table */}
      <section className="flex h-full w-[52%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">Quản lý người dùng</h1>
              <p className="mt-0.5 text-[10px] text-vin-muted">
                {filteredUsers.length} tài khoản
              </p>
            </div>
            <button
              onClick={() => {
                setMode("create");
                setSelectedUserId(null);
                setCreateFormKey(k => k + 1);
                setCreateRole("DOCTOR");
              }}
              className="flex items-center gap-1.5 rounded border border-vin-accent/50 bg-vin-accent px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-vin-accentHover"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tạo mới
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded border border-vin-border bg-vin-panel py-1.5 pl-7 pr-7 text-[11px] text-vin-text placeholder:text-vin-faint outline-none transition focus:border-vin-accent"
              placeholder="Tìm username, họ tên, vai trò..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-vin-faint transition hover:text-vin-text"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
              <tr>
                <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                <th className="px-2 py-2">Username</th>
                <th className="px-2 py-2">Họ tên</th>
                <th className="px-2 py-2 text-center">Vai trò</th>
                <th className="px-2 py-2 text-center">Trạng thái</th>
                <th className="px-2 py-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vin-border/45 text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vin-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vin-muted">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const isSelected = user.id === selectedUserId && mode === "view";

                  return (
                    <tr
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setMode("view");
                      }}
                      className={`cursor-pointer select-none border-l-2 transition-colors ${
                        isSelected
                          ? "border-l-vin-accent bg-vin-tableSelected text-white"
                          : "border-l-transparent odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 hover:bg-vin-tableHover"
                      }`}
                    >
                      <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-vin-accent" />
                          <span className="font-semibold text-white">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="max-w-[200px] truncate">{user.fullName}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <StatusBadge active={user.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-vin-text2">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right Panel — Edit / Create */}
      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {mode === "create" ? (
          /* ── Create new user form ── */
          <React.Fragment key={createFormKey}>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserPlus className="h-4 w-4 text-vin-accent" />
                  Tạo tài khoản mới
                </h2>
                <button
                  onClick={() => setMode("view")}
                  className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleCreateSubmit}
              className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark"
              encType="multipart/form-data"
              autoComplete="off"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Username</label>
                  <input
                    name="username"
                    required
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                    placeholder="vd: bsnguyenvana"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Họ tên</label>
                  <input
                    name="fullName"
                    required
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mật khẩu</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Vai trò</label>
                  <select
                    name="role"
                    value={createRole}
                    onChange={event => setCreateRole(event.target.value as AppRole)}
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="DOCTOR">Bác sĩ</option>
                    <option value="TECHNICIAN">Kỹ thuật viên</option>
                    <option value="RECEPTION">Lễ tân</option>
                  </select>
                </div>
              </div>

              <RolePermissionSummary role={createRole} />

              <div className="border-t border-vin-border/50 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Hồ sơ bác sĩ (nếu có)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chức danh</label>
                    <input
                      name="title"
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                      placeholder="BS.CKI"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chuyên khoa</label>
                    <input
                      name="specialty"
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                      placeholder="CĐHA"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Số CCHN</label>
                  <input
                    name="licenseNumber"
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                  />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-vin-text2">
                  <input name="isSigningDoctor" type="checkbox" defaultChecked className="h-4 w-4 accent-vin-accent" />
                  Bác sĩ ký phiếu
                </label>
                <div className="mt-3">
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <Upload className="h-3 w-3" />
                    Chữ ký scan
                  </label>
                  <input
                    name="signature"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-accent/50 bg-vin-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </React.Fragment>
        ) : selectedUser ? (
          /* ── Edit selected user ── */
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 truncate text-sm font-bold uppercase tracking-wide text-white">
                    <Shield className="h-4 w-4 text-vin-accent" />
                    {selectedUser.username}
                  </h2>
                  <p className="mt-1 text-[10px] text-vin-muted">
                    {selectedUser.fullName} · {roleLabels[selectedUser.role] || selectedUser.role}
                  </p>
                </div>
                <StatusBadge active={selectedUser.isActive} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="text-vin-muted">Tạo:</span>{" "}
                  <span className="font-semibold text-vin-text2">
                    {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-vin-muted">Cập nhật:</span>{" "}
                  <span className="font-semibold text-vin-text2">
                    {new Date(selectedUser.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            <form
              key={selectedUser.id}
              onSubmit={handleUpdateSubmit}
              className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark"
              encType="multipart/form-data"
            >
              <input type="hidden" name="userId" value={selectedUser.id} />

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Họ tên</label>
                <input
                  name="fullName"
                  defaultValue={selectedUser.fullName}
                  required
                  className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Vai trò</label>
                  <select
                    name="role"
                    value={editRole}
                    onChange={event => setEditRole(event.target.value as AppRole)}
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="DOCTOR">Bác sĩ</option>
                    <option value="TECHNICIAN">Kỹ thuật viên</option>
                    <option value="RECEPTION">Lễ tân</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <KeyRound className="h-3 w-3" />
                    Đổi mật khẩu
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
                    placeholder="Bỏ trống nếu không đổi"
                  />
                </div>
              </div>

              <RolePermissionSummary role={editRole} />

              <label className="flex items-center gap-2 text-sm text-vin-text2">
                <input name="isActive" type="checkbox" defaultChecked={selectedUser.isActive} className="h-4 w-4 accent-vin-accent" />
                Cho phép đăng nhập
              </label>

              <div className="border-t border-vin-border/50 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Hồ sơ bác sĩ</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chức danh</label>
                    <input
                      name="title"
                      defaultValue={profile?.title || ""}
                      disabled={!isDoctor}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent"
                      placeholder="BS.CKI"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chuyên khoa</label>
                    <input
                      name="specialty"
                      defaultValue={profile?.specialty || ""}
                      disabled={!isDoctor}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent"
                      placeholder="CĐHA"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Số CCHN</label>
                    <input
                      name="licenseNumber"
                      defaultValue={profile?.licenseNumber || ""}
                      disabled={!isDoctor}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent"
                    />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-vin-text2">
                  <input
                    name="isSigningDoctor"
                    type="checkbox"
                    defaultChecked={profile?.isSigningDoctor ?? true}
                    disabled={!isDoctor}
                    className="h-4 w-4 accent-vin-accent disabled:opacity-45"
                  />
                  Bác sĩ ký phiếu
                </label>

                <div className="mt-3">
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <Upload className="h-3 w-3" />
                    Chữ ký scan
                  </label>
                  <input
                    name="signature"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={!isDoctor}
                    className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white disabled:opacity-45"
                  />
                  {profile?.signatureImagePath && (
                    <div className="mt-2 rounded border border-vin-border bg-white p-2">
                      <img src={profile.signatureImagePath} alt={`Chữ ký ${selectedUser.fullName}`} className="max-h-14 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-vin-accent/50 bg-vin-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ── Empty state ── */
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-vin-border bg-vin-shell">
              <UserCog className="h-7 w-7 text-vin-faint" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-vin-text2">Chưa chọn người dùng</h3>
            <p className="max-w-[250px] text-[11px] leading-relaxed text-vin-muted">
              Click vào tài khoản bên trái để chỉnh sửa, hoặc nhấn &quot;Tạo mới&quot; để thêm tài khoản.
            </p>
            <div className="mt-5 w-[min(92%,620px)]">
              <PermissionMatrix />
            </div>
          </div>
        )}
      </section>

      <style>{`
        .scr-dark::-webkit-scrollbar{width:5px;height:5px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:var(--vin-border-subtle);border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:var(--vin-border-strong)}
      `}</style>
    </div>
  );
}
