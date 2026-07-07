"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  Upload,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { CustomSelect } from "@/app/components/CustomSelect";
import {
  createRoleProfileAction,
  createUserAction,
  getRoleProfilesForAdmin,
  getUsersForAdmin,
  importUsersDryRunAction,
  updateRoleProfileAction,
  updateUserAction,
} from "./actions";
import {
  getPermissionsForRole,
  permissionGroups,
  permissionLabels,
  roleDescriptions,
  roleLabels as systemRoleLabels,
  type SystemRole,
} from "@/lib/permissions";

type RoleProfile = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseRole: SystemRole;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { users: number };
};

type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: SystemRole;
  roleProfileId?: string | null;
  roleProfile?: RoleProfile | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  doctorProfile?: any;
};

type ActiveTab = "users" | "roles";
type Mode = "view" | "createUser" | "createRole" | "importUsers";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex max-w-[92px] justify-center truncate rounded px-2 py-0.5 text-[9px] font-bold ${
      active ? "bg-vin-status-approved-bg text-white" : "bg-vin-status-danger-bg text-white"
    }`}>
      {active ? "Đang dùng" : "Đã khóa"}
    </span>
  );
}

function RoleBadge({ roleProfile, fallbackRole }: { roleProfile?: RoleProfile | null; fallbackRole?: string }) {
  const label = roleProfile?.name || (fallbackRole ? systemRoleLabels[fallbackRole as SystemRole] || fallbackRole : "Chưa gán");
  const isAdmin = (roleProfile?.baseRole || fallbackRole) === "ADMIN";
  const isDoctor = (roleProfile?.baseRole || fallbackRole) === "DOCTOR";
  const isTech = (roleProfile?.baseRole || fallbackRole) === "TECHNICIAN";
  const classes = isAdmin
    ? "bg-amber-900/25 text-amber-200 border-amber-500/30"
    : isDoctor
      ? "bg-vin-accentSoft/20 text-vin-accent border-vin-accent/40"
      : isTech
        ? "bg-cyan-900/30 text-cyan-200 border-cyan-500/30"
        : "bg-emerald-900/25 text-emerald-200 border-emerald-500/30";

  return (
    <span className={`inline-flex max-w-[150px] justify-center truncate rounded border px-1.5 py-px text-[10px] font-bold ${classes}`}>
      {label}
    </span>
  );
}

function getRolePermissions(roleProfile?: RoleProfile | null, fallbackRole?: string | null) {
  return roleProfile?.permissions?.length ? roleProfile.permissions : getPermissionsForRole(fallbackRole);
}

function RolePermissionSummary({ roleProfile, fallbackRole }: { roleProfile?: RoleProfile | null; fallbackRole?: string | null }) {
  const permissions = new Set(getRolePermissions(roleProfile, fallbackRole));
  const title = roleProfile?.name || (fallbackRole ? systemRoleLabels[fallbackRole as SystemRole] || fallbackRole : "Vai trò");
  const description = roleProfile?.description || (fallbackRole ? roleDescriptions[fallbackRole as SystemRole] : "");

  return (
    <section className="rounded border border-vin-border bg-vin-shell px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-vin-muted">Quyền của vai trò</div>
          <div className="mt-1 text-sm font-bold text-white">{title}</div>
          {description && <div className="mt-0.5 text-[11px] leading-relaxed text-vin-muted">{description}</div>}
        </div>
        <RoleBadge roleProfile={roleProfile} fallbackRole={fallbackRole || undefined} />
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

function PermissionChecklist({ defaultPermissions = [], disabled = false }: { defaultPermissions?: string[]; disabled?: boolean }) {
  const selected = new Set(defaultPermissions);

  return (
    <div className="grid grid-cols-1 gap-3">
      {permissionGroups.map(group => (
        <section key={group.title} className="rounded border border-vin-border bg-vin-shell p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">{group.title}</div>
          <div className="grid grid-cols-1 gap-2">
            {group.permissions.map(permission => (
              <label key={permission} className="flex items-center gap-2 text-[12px] text-vin-text2">
                <input
                  name="permissions"
                  type="checkbox"
                  value={permission}
                  defaultChecked={selected.has(permission)}
                  disabled={disabled}
                  className="h-4 w-4 accent-vin-accent disabled:opacity-40"
                />
                <span>{permissionLabels[permission]}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PermissionMatrix({ roleProfiles }: { roleProfiles: RoleProfile[] }) {
  const visibleRoles = roleProfiles.filter(role => role.isActive || role.isSystem);

  return (
    <section className="rounded border border-vin-border bg-vin-shell p-3 text-left">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Ma trận quyền</div>
      <div className="max-h-72 overflow-auto scr-dark">
        <table className="w-full min-w-[720px] text-[10px]">
          <thead className="sticky top-0 bg-vin-shell text-vin-muted">
            <tr>
              <th className="py-1.5 pr-2 text-left">Quyền</th>
              {visibleRoles.map(role => (
                <th key={role.id} className="px-1.5 py-1.5 text-center">{role.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vin-border/50">
            {permissionGroups.flatMap(group => group.permissions).map(permission => (
              <tr key={permission}>
                <td className="py-1.5 pr-2 text-vin-text2">{permissionLabels[permission]}</td>
                {visibleRoles.map(role => (
                  <td key={`${role.id}-${permission}`} className="px-1.5 py-1.5 text-center">
                    {role.permissions.includes(permission) ? (
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

function baseRoleOptions() {
  return (Object.keys(systemRoleLabels) as SystemRole[]).map(role => ({
    value: role,
    label: systemRoleLabels[role],
  }));
}

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");
  const [mode, setMode] = useState<Mode>("view");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [createRoleFormKey, setCreateRoleFormKey] = useState(0);
  const [createRoleProfileId, setCreateRoleProfileId] = useState("");
  const [editRoleProfileId, setEditRoleProfileId] = useState("");
  const [importResults, setImportResults] = useState<{successCount: number; errorCount: number; results: any[]} | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userRows, roleRows] = await Promise.all([
        getUsersForAdmin(),
        getRoleProfilesForAdmin(),
      ]);
      setUsers((userRows || []) as UserRow[]);
      setRoleProfiles((roleRows || []) as RoleProfile[]);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu quản trị.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Quản lý người dùng";
  }, []);

  const activeRoleProfiles = useMemo(() => roleProfiles.filter(role => role.isActive), [roleProfiles]);
  const defaultRoleProfileId = activeRoleProfiles.find(role => role.code === "DOCTOR")?.id || activeRoleProfiles[0]?.id || "";

  useEffect(() => {
    if (!createRoleProfileId && defaultRoleProfileId) {
      setCreateRoleProfileId(defaultRoleProfileId);
    }
  }, [createRoleProfileId, defaultRoleProfileId]);

  const selectedUser = users.find(user => user.id === selectedUserId) || null;
  const selectedRole = roleProfiles.find(role => role.id === selectedRoleId) || null;
  const selectedCreateRoleProfile = roleProfiles.find(role => role.id === createRoleProfileId) || null;
  const selectedEditRoleProfile = roleProfiles.find(role => role.id === editRoleProfileId) || null;

  const effectiveRoleProfile = (user?: UserRow | null) => {
    if (!user) return null;
    return user.roleProfile || roleProfiles.find(role => role.id === user.roleProfileId) || roleProfiles.find(role => role.code === user.role) || null;
  };

  useEffect(() => {
    const profile = effectiveRoleProfile(selectedUser);
    if (selectedUser && profile?.id) setEditRoleProfileId(profile.id);
  }, [selectedUser?.id, selectedUser?.roleProfileId, roleProfiles.length]);

  const filteredUsers = searchQuery.trim()
    ? users.filter(user => {
        const profile = effectiveRoleProfile(user);
        return `${user.username} ${user.fullName} ${profile?.name || user.role}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      })
    : users;

  const filteredRoles = searchQuery.trim()
    ? roleProfiles.filter(role =>
        `${role.name} ${role.code} ${role.description || ""} ${role.permissions.join(" ")}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : roleProfiles;

  const handleCreateUserSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      await createUserAction(formData);
      await loadData();
      setMode("view");
      setCreateRoleProfileId(defaultRoleProfileId);
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Không tạo được tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUserSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      await updateUserAction(formData);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được tài khoản.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      const role = await createRoleProfileAction(formData);
      await loadData();
      setSelectedRoleId(role.id);
      setMode("view");
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Không tạo được vai trò.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    try {
      const formData = new FormData(event.currentTarget);
      await updateRoleProfileAction(formData);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được vai trò.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setImportResults(null);
    try {
      const formData = new FormData(event.currentTarget);
      const res = await importUsersDryRunAction(formData);
      setImportResults(res);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Lỗi kiểm tra file import.");
    } finally {
      setIsSaving(false);
    }
  };

  const showUserCreate = mode === "createUser";
  const showRoleCreate = mode === "createRole";
  const showImportUsers = mode === "importUsers";
  const createUserIsDoctor = selectedCreateRoleProfile?.baseRole === "DOCTOR";
  const editUserIsDoctor = selectedEditRoleProfile?.baseRole === "DOCTOR";

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <section className="flex h-full w-[52%] min-w-[640px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="min-w-[132px]">
                <ScreenHeader />
                <p className="mt-0.5 text-[10px] text-vin-muted">
                  {activeTab === "users" ? `${filteredUsers.length} tài khoản` : `${filteredRoles.length} vai trò`}
                </p>
              </div>
              <div className="flex h-8 shrink-0 items-center rounded border border-vin-border bg-vin-panel p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("users");
                    setMode("view");
                    setErrorMessage("");
                  }}
                  className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition ${
                    activeTab === "users" ? "bg-vin-tableSelected text-white" : "text-vin-muted hover:text-white"
                  }`}
                  title="Người dùng"
                >
                  <Users className="h-3.5 w-3.5" />
                  Người dùng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("roles");
                    setMode("view");
                    setErrorMessage("");
                  }}
                  className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition ${
                    activeTab === "roles" ? "bg-vin-tableSelected text-white" : "text-vin-muted hover:text-white"
                  }`}
                  title="Vai trò & quyền"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Vai trò & quyền
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setErrorMessage("");
                  setImportResults(null);
                  setMode("importUsers");
                }}
                className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-panel px-2.5 py-1 text-[11px] font-semibold text-vin-muted transition hover:text-white hover:bg-vin-panel2"
              >
                <Upload className="h-3.5 w-3.5" />
                Import (Dry-run)
              </button>
              <button
                onClick={() => {
                  setErrorMessage("");
                  if (activeTab === "users") {
                    setMode("createUser");
                    setSelectedUserId(null);
                    setCreateFormKey(key => key + 1);
                    setCreateRoleProfileId(defaultRoleProfileId);
                  } else {
                    setMode("createRole");
                    setSelectedRoleId(null);
                    setCreateRoleFormKey(key => key + 1);
                  }
                }}
                className="flex items-center gap-1.5 rounded border-0 bg-vin-accent px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-vin-accentHover"
              >
                {activeTab === "users" ? <UserPlus className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {activeTab === "users" ? "Tạo tài khoản" : "Tạo vai trò"}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              className="w-full rounded border border-vin-border bg-vin-panel py-1.5 pl-7 pr-7 text-[11px] text-vin-text placeholder:text-vin-faint outline-none transition focus:border-vin-accent"
              placeholder={activeTab === "users" ? "Tìm username, họ tên, vai trò..." : "Tìm tên vai trò, mã, quyền..."}
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
          {activeTab === "users" ? (
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
                    <td colSpan={6} className="py-12 text-center text-vin-muted">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const isSelected = user.id === selectedUserId && mode === "view";
                    const profile = effectiveRoleProfile(user);

                    return (
                      <tr
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setMode("view");
                          setErrorMessage("");
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
                          <RoleBadge roleProfile={profile} fallbackRole={user.role} />
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
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-vin-border bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
                <tr>
                  <th className="w-9 py-2 pl-2 pr-1 text-center">TT</th>
                  <th className="px-2 py-2">Vai trò</th>
                  <th className="px-2 py-2">Mã</th>
                  <th className="px-2 py-2 text-center">Nhóm gốc</th>
                  <th className="px-2 py-2 text-center">Users</th>
                  <th className="px-2 py-2 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vin-border/45 text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-vin-muted">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                      Đang tải danh sách vai trò...
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-vin-muted">Không tìm thấy vai trò nào.</td>
                  </tr>
                ) : (
                  filteredRoles.map((role, index) => {
                    const isSelected = role.id === selectedRoleId && mode === "view";

                    return (
                      <tr
                        key={role.id}
                        onClick={() => {
                          setSelectedRoleId(role.id);
                          setMode("view");
                          setErrorMessage("");
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
                            {role.isSystem ? <Lock className="h-3 w-3 text-amber-300" /> : <ShieldCheck className="h-3 w-3 text-vin-accent" />}
                            <span className="font-semibold text-white">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 font-mono text-vin-muted">{role.code}</td>
                        <td className="px-2 py-2 text-center">{systemRoleLabels[role.baseRole] || role.baseRole}</td>
                        <td className="px-2 py-2 text-center font-mono">{role._count?.users || 0}</td>
                        <td className="px-2 py-2 text-center">
                          <StatusBadge active={role.isActive} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        {errorMessage && (
          <div className="border-b border-red-400/30 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-100">
            {errorMessage}
          </div>
        )}

        {showUserCreate ? (
          <React.Fragment key={createFormKey}>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserPlus className="h-4 w-4 text-vin-accent" />
                  Tạo tài khoản mới
                </h2>
                <button onClick={() => setMode("view")} className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white" title="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark" encType="multipart/form-data" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Username</label>
                  <input name="username" required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="vd: thukybs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Họ tên</label>
                  <input name="fullName" required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="Nguyễn Văn A" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mật khẩu</label>
                  <input name="password" type="password" required minLength={6} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="Tối thiểu 6 ký tự" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Vai trò</label>
                  <CustomSelect
                    name="roleProfileId"
                    options={activeRoleProfiles.map(role => ({ value: role.id, label: role.name }))}
                    value={createRoleProfileId}
                    onChange={val => setCreateRoleProfileId(val)}
                  />
                </div>
              </div>

              <RolePermissionSummary roleProfile={selectedCreateRoleProfile} />

              <div className="border-t border-vin-border/50 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Hồ sơ bác sĩ</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chức danh</label>
                    <input name="title" disabled={!createUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" placeholder="BS.CKI" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chuyên khoa</label>
                    <input name="specialty" disabled={!createUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" placeholder="CĐHA" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Số CCHN</label>
                  <input name="licenseNumber" disabled={!createUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-vin-text2">
                  <input name="isSigningDoctor" type="checkbox" defaultChecked disabled={!createUserIsDoctor} className="h-4 w-4 accent-vin-accent disabled:opacity-45" />
                  Bác sĩ ký phiếu
                </label>
                <div className="mt-3">
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <Upload className="h-3 w-3" />
                    Chữ ký scan
                  </label>
                  <input name="signature" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!createUserIsDoctor} className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white disabled:opacity-45" />
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Tạo tài khoản
              </button>
            </form>
          </React.Fragment>
        ) : showRoleCreate ? (
          <React.Fragment key={createRoleFormKey}>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="h-4 w-4 text-vin-accent" />
                  Tạo vai trò mới
                </h2>
                <button onClick={() => setMode("view")} className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white" title="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateRoleSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Tên vai trò</label>
                  <input name="name" required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="Thư ký bác sĩ" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mã vai trò</label>
                  <input name="code" className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="DOCTOR_SECRETARY" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Nhóm gốc</label>
                  <CustomSelect
                    name="baseRole"
                    options={baseRoleOptions()}
                    value="RECEPTION"
                  />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm text-vin-text2">
                  <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-vin-accent" />
                  Cho phép sử dụng
                </label>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mô tả</label>
                <textarea name="description" rows={3} className="w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="Chỉ tra cứu Archive và in lại kết quả." />
              </div>
              <PermissionChecklist defaultPermissions={["archive.read"]} />
              <button type="submit" disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Tạo vai trò
              </button>
            </form>
          </React.Fragment>
        ) : showImportUsers ? (
          <React.Fragment>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Upload className="h-4 w-4 text-vin-accent" />
                  Kiểm tra import tài khoản
                </h2>
                <button onClick={() => setMode("view")} className="rounded p-1 text-vin-muted transition hover:bg-vin-panel hover:text-white" title="Đóng">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 flex flex-col gap-4 scr-dark">
              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">File CSV</label>
                  <input name="file" type="file" accept=".csv" required className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white" />
                  <p className="mt-1 text-[10px] text-vin-muted">Cấu trúc: username, fullname, role (Mã role hoặc Tên role). Cần có dòng tiêu đề.</p>
                </div>
                <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Kiểm tra file (Dry run)
                </button>
              </form>
              
              {importResults && (
                <div className="mt-4 border-t border-vin-border/50 pt-4">
                  <div className="mb-3 flex items-center gap-4 text-sm font-bold">
                    <span className="text-emerald-400">Hợp lệ: {importResults.successCount}</span>
                    <span className="text-red-400">Lỗi: {importResults.errorCount}</span>
                  </div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-vin-panel2 text-vin-muted border-b border-vin-border">
                      <tr>
                        <th className="py-1 px-2">Dòng</th>
                        <th className="py-1 px-2">Username</th>
                        <th className="py-1 px-2">Họ tên</th>
                        <th className="py-1 px-2">Role</th>
                        <th className="py-1 px-2">Trạng thái</th>
                        <th className="py-1 px-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vin-border/40 text-vin-text2">
                      {importResults.results.map((r, i) => (
                        <tr key={i} className={r.status === "Lỗi" ? "bg-red-950/20" : ""}>
                          <td className="py-1 px-2">{r.row}</td>
                          <td className="py-1 px-2">{r.username}</td>
                          <td className="py-1 px-2">{r.fullName}</td>
                          <td className="py-1 px-2">{r.role}</td>
                          <td className={`py-1 px-2 font-bold ${r.status === "Lỗi" ? "text-red-400" : "text-emerald-400"}`}>{r.status}</td>
                          <td className="py-1 px-2">{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </React.Fragment>
        ) : activeTab === "users" && selectedUser ? (
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 truncate text-sm font-bold uppercase tracking-wide text-white">
                    <Shield className="h-4 w-4 text-vin-accent" />
                    {selectedUser.username}
                  </h2>
                  <p className="mt-1 text-[10px] text-vin-muted">
                    {selectedUser.fullName} · {(selectedEditRoleProfile || effectiveRoleProfile(selectedUser))?.name || selectedUser.role}
                  </p>
                </div>
                <StatusBadge active={selectedUser.isActive} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="text-vin-muted">Tạo:</span>{" "}
                  <span className="font-semibold text-vin-text2">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div>
                  <span className="text-vin-muted">Cập nhật:</span>{" "}
                  <span className="font-semibold text-vin-text2">{new Date(selectedUser.updatedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>

            <form key={selectedUser.id} onSubmit={handleUpdateUserSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark" encType="multipart/form-data">
              <input type="hidden" name="userId" value={selectedUser.id} />
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Họ tên</label>
                <input name="fullName" defaultValue={selectedUser.fullName} required className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Vai trò</label>
                  <CustomSelect
                    name="roleProfileId"
                    options={roleProfiles
                      .filter(role => role.isActive || role.id === editRoleProfileId)
                      .map(role => ({
                        value: role.id,
                        label: `${role.name}${!role.isActive ? " (đã khóa)" : ""}`
                      }))}
                    value={editRoleProfileId}
                    onChange={val => setEditRoleProfileId(val)}
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <KeyRound className="h-3 w-3" />
                    Đổi mật khẩu
                  </label>
                  <input name="password" type="password" minLength={6} className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" placeholder="Bỏ trống nếu không đổi" />
                </div>
              </div>

              <RolePermissionSummary roleProfile={selectedEditRoleProfile || effectiveRoleProfile(selectedUser)} fallbackRole={selectedUser.role} />

              <label className="flex items-center gap-2 text-sm text-vin-text2">
                <input name="isActive" type="checkbox" defaultChecked={selectedUser.isActive} className="h-4 w-4 accent-vin-accent" />
                Cho phép đăng nhập
              </label>

              <div className="border-t border-vin-border/50 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-vin-muted">Hồ sơ bác sĩ</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chức danh</label>
                    <input name="title" defaultValue={selectedUser.doctorProfile?.title || ""} disabled={!editUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" placeholder="BS.CKI" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Chuyên khoa</label>
                    <input name="specialty" defaultValue={selectedUser.doctorProfile?.specialty || ""} disabled={!editUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" placeholder="CĐHA" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Số CCHN</label>
                    <input name="licenseNumber" defaultValue={selectedUser.doctorProfile?.licenseNumber || ""} disabled={!editUserIsDoctor} className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none disabled:opacity-45 focus:border-vin-accent" />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-vin-text2">
                  <input name="isSigningDoctor" type="checkbox" defaultChecked={selectedUser.doctorProfile?.isSigningDoctor ?? true} disabled={!editUserIsDoctor} className="h-4 w-4 accent-vin-accent disabled:opacity-45" />
                  Bác sĩ ký phiếu
                </label>
                <div className="mt-3">
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-vin-muted">
                    <Upload className="h-3 w-3" />
                    Chữ ký scan
                  </label>
                  <input name="signature" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!editUserIsDoctor} className="block w-full text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-shell file:px-3 file:py-2 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white disabled:opacity-45" />
                  {selectedUser.doctorProfile?.signatureImagePath && (
                    <div className="mt-2 rounded border border-vin-border bg-white p-2">
                      <img src={selectedUser.doctorProfile.signatureImagePath} alt={`Chữ ký ${selectedUser.fullName}`} className="max-h-14 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Lưu thay đổi
              </button>
            </form>
          </>
        ) : activeTab === "roles" && selectedRole ? (
          <>
            <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 truncate text-sm font-bold uppercase tracking-wide text-white">
                    {selectedRole.isSystem ? <Lock className="h-4 w-4 text-amber-300" /> : <ShieldCheck className="h-4 w-4 text-vin-accent" />}
                    {selectedRole.name}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] text-vin-muted">{selectedRole.code}</p>
                </div>
                <StatusBadge active={selectedRole.isActive} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="text-vin-muted">Nhóm gốc:</span>{" "}
                  <span className="font-semibold text-vin-text2">{systemRoleLabels[selectedRole.baseRole]}</span>
                </div>
                <div>
                  <span className="text-vin-muted">Số tài khoản:</span>{" "}
                  <span className="font-semibold text-vin-text2">{selectedRole._count?.users || 0}</span>
                </div>
              </div>
            </div>

            <form key={selectedRole.id} onSubmit={handleUpdateRoleSubmit} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
              <input type="hidden" name="roleProfileId" value={selectedRole.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Tên vai trò</label>
                  <input name="name" defaultValue={selectedRole.name} required className="h-10 w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mã vai trò</label>
                  <input value={selectedRole.code} disabled className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 font-mono text-sm text-vin-muted outline-none opacity-70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Nhóm gốc</label>
                  <CustomSelect
                    name="baseRole"
                    options={baseRoleOptions()}
                    value={selectedRole.baseRole}
                    disabled={selectedRole.isSystem}
                  />
                </div>
                <label className="mt-6 flex items-center gap-2 text-sm text-vin-text2">
                  <input name="isActive" type="checkbox" defaultChecked={selectedRole.isActive} disabled={selectedRole.isSystem} className="h-4 w-4 accent-vin-accent disabled:opacity-45" />
                  Cho phép sử dụng
                </label>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Mô tả</label>
                <textarea name="description" defaultValue={selectedRole.description || ""} rows={3} className="w-full resize-none rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent" />
              </div>
              <PermissionChecklist defaultPermissions={selectedRole.permissions} disabled={selectedRole.isSystem} />
              <button type="submit" disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Lưu vai trò
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-vin-border bg-vin-shell">
              {activeTab === "users" ? <UserCog className="h-7 w-7 text-vin-faint" /> : <ShieldCheck className="h-7 w-7 text-vin-faint" />}
            </div>
            <h3 className="mb-1 text-sm font-semibold text-vin-text2">
              {activeTab === "users" ? "Chưa chọn người dùng" : "Chưa chọn vai trò"}
            </h3>
            <p className="max-w-[280px] text-[11px] leading-relaxed text-vin-muted">
              {activeTab === "users"
                ? "Chọn tài khoản bên trái để chỉnh sửa, hoặc tạo tài khoản mới."
                : "Chọn vai trò bên trái để chỉnh sửa quyền, hoặc tạo vai trò mới."}
            </p>
            <div className="mt-5 w-[min(92%,760px)]">
              <PermissionMatrix roleProfiles={roleProfiles} />
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
