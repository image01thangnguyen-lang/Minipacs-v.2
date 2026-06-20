import Link from "next/link";
import { BadgeCheck, ChevronLeft, KeyRound, PenLine, Shield, Upload, UserPlus, Users } from "lucide-react";
import { AppSidebar } from "@/app/components/AppSidebar";
import { createUserAction, getUsersForAdmin, updateUserAction } from "./actions";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "Kỹ thuật viên",
  RECEPTION: "Lễ tân",
};

function RoleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select
      name="role"
      defaultValue={defaultValue || "DOCTOR"}
      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent"
    >
      <option value="ADMIN">Admin</option>
      <option value="DOCTOR">Bác sĩ</option>
      <option value="TECHNICIAN">Kỹ thuật viên</option>
      <option value="RECEPTION">Lễ tân</option>
    </select>
  );
}

export default async function UserManagementPage() {
  const users = await getUsersForAdmin();

  return (
    <main className="flex h-screen overflow-hidden bg-vin-root text-vin-text">
      <AppSidebar active="users" />
      <section className="min-w-0 flex-1 overflow-auto">
        <header className="border-b border-vin-border bg-vin-sidebar px-5 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded border border-vin-border bg-vin-panel px-3 py-2 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-lg font-bold text-white">
                <Users className="h-5 w-5 text-vin-accent" />
                Quản lý người dùng
              </h1>
              <p className="mt-1 text-xs text-vin-muted">Phân quyền, hồ sơ bác sĩ và chữ ký scan cho phiếu kết quả.</p>
            </div>
          </div>
        </header>

      <div className="mx-auto max-w-7xl space-y-5 p-5">
        <section className="border border-vin-border bg-vin-panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-vin-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-vin-text2">Tạo tài khoản mới</h2>
          </div>

          <form action={createUserAction} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_12rem_10rem]" encType="multipart/form-data">
            <input
              name="username"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Username"
              required
            />
            <input
              name="fullName"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Họ tên"
              required
            />
            <input
              name="password"
              type="password"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Mật khẩu"
              required
              minLength={6}
            />
            <RoleSelect />
            <button className="inline-flex items-center justify-center gap-2 rounded border border-vin-accent/50 bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover">
              <UserPlus className="h-4 w-4" />
              Tạo
            </button>

            <input
              name="title"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Chức danh bác sĩ"
            />
            <input
              name="specialty"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Chuyên khoa"
            />
            <input
              name="licenseNumber"
              className="rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none placeholder:text-vin-faint focus:border-vin-accent"
              placeholder="Số CCHN"
            />
            <label className="flex items-center gap-2 rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text2">
              <input name="isSigningDoctor" type="checkbox" defaultChecked className="h-4 w-4 accent-vin-accent" />
              Ký phiếu
            </label>
            <input
              name="signature"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block rounded border border-vin-border bg-vin-shell px-3 py-2 text-xs text-vin-muted file:mr-2 file:rounded file:border-0 file:bg-vin-panel file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-vin-text2 hover:file:text-white"
            />
          </form>
        </section>

        <section className="space-y-3">
          {users.map(user => {
            const profile = user.doctorProfile;
            const isDoctor = user.role === "DOCTOR";

            return (
              <form
                key={user.id}
                action={updateUserAction}
                className="border border-vin-border bg-vin-panel p-4"
                encType="multipart/form-data"
              >
                <input type="hidden" name="userId" value={user.id} />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr_1.5fr_12rem]">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-vin-accent" />
                      <span className="text-sm font-bold text-white">{user.username}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${user.isActive ? "bg-vin-status-approved-bg text-white" : "bg-vin-status-danger-bg text-white"}`}>
                        {user.isActive ? "Đang dùng" : "Đã khóa"}
                      </span>
                    </div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Họ tên</label>
                    <input
                      name="fullName"
                      defaultValue={user.fullName}
                      className="w-full rounded border border-vin-border bg-vin-shell px-3 py-2 text-sm text-vin-text outline-none focus:border-vin-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-vin-muted">Vai trò</label>
                    <RoleSelect defaultValue={user.role} />
                    <label className="mt-3 flex items-center gap-2 text-sm text-vin-text2">
                      <input name="isActive" type="checkbox" defaultChecked={user.isActive} className="h-4 w-4 accent-vin-accent" />
                      Cho phép đăng nhập
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                    <label className="flex items-center gap-2 text-sm text-vin-text2 md:col-span-3">
                      <input
                        name="isSigningDoctor"
                        type="checkbox"
                        defaultChecked={profile?.isSigningDoctor ?? true}
                        disabled={!isDoctor}
                        className="h-4 w-4 accent-vin-accent disabled:opacity-45"
                      />
                      Bác sĩ ký phiếu
                    </label>
                  </div>

                  <div className="space-y-3">
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

                    <div>
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
                          <img src={profile.signatureImagePath} alt={`Chữ ký ${user.fullName}`} className="max-h-14 object-contain" />
                        </div>
                      )}
                    </div>

                    <button className="inline-flex w-full items-center justify-center gap-2 rounded border border-vin-accent/50 bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accentHover">
                      <BadgeCheck className="h-4 w-4" />
                      Lưu
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-vin-faint">
                  <PenLine className="h-3 w-3" />
                  {roleLabels[user.role]} · Tạo {user.createdAt.toLocaleDateString("vi-VN")} · Cập nhật {user.updatedAt.toLocaleDateString("vi-VN")}
                </div>
              </form>
            );
          })}
        </section>
      </div>
      </section>
    </main>
  );
}
