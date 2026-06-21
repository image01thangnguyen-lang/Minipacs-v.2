"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FilePlus2,
  Loader2,
  MonitorUp,
  RefreshCcw,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppSidebar } from "@/app/components/AppSidebar";
import { CustomSelect, type SelectOption } from "@/app/components/CustomSelect";
import { CustomDatePicker } from "@/app/components/CustomDatePicker";
import {
  cancelWorklistOrderAction,
  checkInWorklistOrderAction,
  createWorklistAction,
  getWorklistOrdersAction,
  regenerateWorklistFileAction
} from "./actions";
import { worklistSchema, type WorklistInput } from "./schema";

type FormValues = WorklistInput;

type WorklistOrderView = {
  id: string;
  patientName: string;
  patientId: string;
  dob?: string | null;
  gender?: string;
  phone?: string;
  referringPhysician?: string;
  modality: string;
  bodyPart?: string;
  procedureDescription?: string;
  priority: string;
  scheduledStationAeTitle?: string;
  scheduledStationName?: string;
  accessionNumber: string;
  requestedStudyInstanceUid?: string;
  scheduledDate?: string | null;
  arrivedAt?: string | null;
  cancelledAt?: string | null;
  notes?: string;
  orderStatus: string;
  studyStatus?: string | null;
  orthancStudyId?: string | null;
  studyInstanceUid?: string;
};

const orderStatusLabels: Record<string, string> = {
  REQUESTED: "Mới tạo",
  SCHEDULED: "Đã hẹn",
  ARRIVED: "Đã đến",
  CANCELLED: "Đã hủy",
  EXPIRED: "Quá hạn",
};

const studyStatusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ERROR: "Lỗi",
};

const modalityOptions = ["DX", "CR", "US", "CT", "MR"];
const statusFilterOptions = ["ALL", "REQUESTED", "SCHEDULED", "ARRIVED", "CANCELLED", "EXPIRED"];

const modalitySelectOptions: SelectOption[] = modalityOptions.map(m => ({ value: m, label: m }));

const statusFilterSelectOptions: SelectOption[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "REQUESTED", label: "Mới tạo" },
  { value: "SCHEDULED", label: "Đã hẹn" },
  { value: "ARRIVED", label: "Đã đến" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Quá hạn" },
];

const genderSelectOptions: SelectOption[] = [
  { value: "M", label: "Nam" },
  { value: "F", label: "Nữ" },
  { value: "O", label: "Khác" },
];

const prioritySelectOptions: SelectOption[] = [
  { value: "ROUTINE", label: "Thường quy" },
  { value: "URGENT", label: "Khẩn" },
  { value: "STAT", label: "Cấp cứu" },
];

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusClass(status: string) {
  if (status === "ARRIVED") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
  if (status === "SCHEDULED") return "border-cyan-400/35 bg-cyan-500/15 text-cyan-100";
  if (status === "CANCELLED" || status === "EXPIRED") return "border-red-400/35 bg-red-500/15 text-red-100";
  return "border-white/10 bg-white/5 text-vin-text2";
}

function priorityClass(priority: string) {
  if (priority === "STAT") return "border-red-400/35 bg-red-500/15 text-red-100";
  if (priority === "URGENT") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-white/10 bg-white/5 text-vin-muted";
}

export default function WorklistPage() {
  const [orders, setOrders] = useState<WorklistOrderView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const defaultValues = useMemo<FormValues>(() => ({
    patientName: "",
    patientId: "",
    dob: "",
    gender: "O",
    phone: "",
    referringPhysician: "",
    modality: "DX",
    bodyPart: "",
    procedureCode: "",
    procedureDescription: "",
    priority: "ROUTINE",
    scheduledDateTime: toDateTimeLocalValue(),
    scheduledStationAeTitle: "AETITLE",
    scheduledStationName: "",
    notes: "",
  }), []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(worklistSchema),
    defaultValues,
  });

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getWorklistOrdersAction({
        date: selectedDate,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery,
      });
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không tải được danh sách order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Mini PACS - Tiếp đón / Worklist";
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedDate, statusFilter]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadOrders();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await createWorklistAction(data);
      if (res.success) {
        setMessage(`Tạo order thành công: ${res.accessionNumber}`);
        reset({
          ...defaultValues,
          scheduledDateTime: toDateTimeLocalValue(),
        });
        await loadOrders();
      } else {
        setError(res.error || "Có lỗi xảy ra khi tạo order.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi tạo order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runOrderAction = async (orderId: string, action: "checkin" | "cancel" | "regen") => {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");
    try {
      const res =
        action === "checkin"
          ? await checkInWorklistOrderAction(orderId)
          : action === "cancel"
            ? await cancelWorklistOrderAction(orderId)
            : await regenerateWorklistFileAction(orderId);

      if (!res.success) {
        setError((res as any).error || "Không cập nhật được order.");
        return;
      }

      setMessage(
        action === "checkin"
          ? "Đã check-in bệnh nhân."
          : action === "cancel"
            ? "Đã hủy order và gỡ file MWL."
            : "Đã tạo lại file MWL."
      );
      await loadOrders();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Không cập nhật được order.");
    } finally {
      setBusyOrderId("");
    }
  };

  const openViewer = (order: WorklistOrderView) => {
    if (!order.studyInstanceUid) return;
    const host = window.location.hostname;
    window.open(`http://${host}:3000/viewer/${encodeURIComponent(order.studyInstanceUid)}`, "_blank");
  };

  const canOpenViewer = (order: WorklistOrderView) => {
    return Boolean(order.studyInstanceUid && order.studyStatus && !["ORDERED", "READY_FOR_SCAN"].includes(order.studyStatus));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <AppSidebar active="worklist" />

      <section className="flex h-full w-[58%] min-w-[760px] flex-col border-r border-vin-border bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
                <CalendarDays className="h-4 w-4 text-vin-accent" />
                Tiếp đón / Modality Worklist
              </h1>
              <p className="mt-0.5 text-[10px] text-vin-muted">
                {orders.length} order trong ngày · MWL được ghi vào PACS worklists
              </p>
            </div>
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-panel px-2.5 py-1.5 text-[11px] font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {(message || error) && (
            <div className={`mb-2 rounded border px-3 py-2 text-[11px] font-semibold ${
              error
                ? "border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 text-red-200"
                : "border-vin-status-approved-bg/60 bg-vin-status-approved-bg/15 text-emerald-100"
            }`}>
              {error || message}
            </div>
          )}

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-[9rem_9rem_1fr] items-center gap-2">
            <CustomDatePicker
              value={selectedDate}
              onChange={val => setSelectedDate(val)}
              compact
            />
            <CustomSelect
              options={statusFilterSelectOptions}
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
              compact
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vin-faint" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-[2.25rem] w-full rounded-md border border-white/10 bg-transparent py-1.5 pl-7 pr-20 text-[11px] text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent focus:bg-vin-root/20"
                placeholder="Tìm tên, PID, accession, chỉ định..."
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-vin-accent px-2 py-1 text-[10px] font-bold text-white">
                Tìm
              </button>
            </div>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scr-dark">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 border-b border-white/10 bg-vin-panel2 text-[10px] font-semibold uppercase tracking-wider text-vin-text2">
              <tr>
                <th className="w-9 py-2 pl-2 pr-1 text-center">#</th>
                <th className="px-2 py-2">Bệnh nhân</th>
                <th className="px-2 py-2">Chỉ định</th>
                <th className="px-2 py-2 text-center">Mod</th>
                <th className="px-2 py-2">Lịch</th>
                <th className="px-2 py-2 text-center">Trạng thái</th>
                <th className="px-2 py-2 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-vin-muted">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-vin-accent" />
                    Đang tải danh sách order...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-vin-muted">Chưa có order nào trong ngày.</td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const isBusy = busyOrderId === order.id;
                  const canMutate = order.orderStatus !== "CANCELLED";

                  return (
                    <tr key={order.id} className="border-b border-white/5 odd:bg-vin-table even:bg-vin-tableAlt text-vin-text2 transition-colors last:border-b-0 hover:bg-vin-tableHover">
                      <td className="py-2 pl-2 pr-1 text-center font-mono text-vin-text">{index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="max-w-[180px] truncate font-semibold uppercase tracking-[0.01em] text-white">{order.patientName}</div>
                        <div className="mt-0.5 truncate font-mono text-[10px] text-vin-muted">
                          {order.patientId} &bull; {order.gender || "?"} &bull; {order.phone || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="max-w-[240px] truncate font-medium text-vin-text2" title={order.procedureDescription || ""}>
                          {order.procedureDescription || "-"}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none ${priorityClass(order.priority)}`}>{order.priority}</span>
                          <span className="truncate font-mono text-[10px] text-vin-muted">{order.accessionNumber}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-vin-accent/40 bg-vin-accentSoft/15 px-2 py-0.5 font-mono text-[10px] font-bold leading-none text-cyan-100">
                          {order.modality}
                        </span>
                        <div className="mt-1 text-[10px] text-vin-muted">{order.bodyPart || "-"}</div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="flex items-center gap-1 text-vin-text2">
                          <Clock className="h-3 w-3 text-vin-accent" />
                          {formatDateTime(order.scheduledDate)}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-vin-muted">
                          AE: {order.scheduledStationAeTitle || "AETITLE"}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-flex max-w-[110px] items-center justify-center truncate rounded-full border px-2.5 py-1 text-[9px] font-bold leading-none ${statusClass(order.orderStatus)}`}>
                          {orderStatusLabels[order.orderStatus] || order.orderStatus}
                        </span>
                        <div className="mt-1 text-[10px] text-vin-muted">
                          {order.studyStatus ? studyStatusLabels[order.studyStatus] || order.studyStatus : "Chưa có ảnh"}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end gap-1">
                          {order.orderStatus === "SCHEDULED" && (
                            <IconButton
                              title="Check-in"
                              disabled={isBusy}
                              onClick={() => runOrderAction(order.id, "checkin")}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          {canMutate && (
                            <IconButton title="Tạo lại MWL" disabled={isBusy} onClick={() => runOrderAction(order.id, "regen")}>
                              <MonitorUp className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          {canOpenViewer(order) && (
                            <IconButton title="Mở viewer" disabled={isBusy} onClick={() => openViewer(order)}>
                              <BadgeCheck className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          {canMutate && (
                            <IconButton title="Hủy order" danger disabled={isBusy} onClick={() => runOrderAction(order.id, "cancel")}>
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relative flex h-full min-w-0 flex-1 flex-col bg-vin-panel text-vin-text2">
        <div className="flex-none border-b border-vin-border bg-vin-panel2 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <FilePlus2 className="h-4 w-4 text-vin-accent" />
            Tạo order mới
          </h2>
          <p className="mt-0.5 text-[10px] text-vin-muted">Tạo DICOM Modality Worklist cho máy chụp lấy lên danh sách.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scr-dark">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên bệnh nhân *" error={errors.patientName?.message}>
              <input {...register("patientName")} className="field-input uppercase" placeholder="NGUYEN VAN A" />
            </Field>
            <Field label="Mã bệnh nhân *" error={errors.patientId?.message}>
              <input {...register("patientId")} className="field-input font-mono" placeholder="PID-12345" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Ngày sinh">
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <CustomDatePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Giới tính">
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <CustomSelect
                    options={genderSelectOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Điện thoại">
              <input {...register("phone")} className="field-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bác sĩ chỉ định">
              <input {...register("referringPhysician")} className="field-input" placeholder="BS. Nguyễn Văn A" />
            </Field>
            <Field label="Ưu tiên">
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <CustomSelect
                    options={prioritySelectOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Modality *" error={errors.modality?.message}>
              <Controller
                control={control}
                name="modality"
                render={({ field }) => (
                  <CustomSelect
                    options={modalitySelectOptions}
                    value={field.value}
                    onChange={field.onChange}
                    mono
                  />
                )}
              />
            </Field>
            <Field label="Body part">
              <input {...register("bodyPart")} className="field-input uppercase" placeholder="CHEST" />
            </Field>
            <Field label="Mã thủ thuật">
              <input {...register("procedureCode")} className="field-input font-mono" placeholder="XR-CHEST" />
            </Field>
          </div>

          <Field label="Mô tả chỉ định">
            <input {...register("procedureDescription")} className="field-input" placeholder="Chụp Xquang ngực thẳng" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Thời gian hẹn">
              <input type="datetime-local" {...register("scheduledDateTime")} className="field-input [color-scheme:dark]" />
            </Field>
            <Field label="Station AE">
              <input {...register("scheduledStationAeTitle")} className="field-input font-mono uppercase" placeholder="AETITLE" />
            </Field>
            <Field label="Phòng/máy">
              <input {...register("scheduledStationName")} className="field-input" placeholder="XQ Phòng 1" />
            </Field>
          </div>

          <Field label="Ghi chú">
            <textarea {...register("notes")} className="field-textarea h-20" placeholder="Ghi chú tiếp đón hoặc lưu ý kỹ thuật..." />
          </Field>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[160px] items-center justify-center gap-2 rounded-lg border-0 bg-vin-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-vin-accent/15 transition hover:bg-vin-accentHover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Tạo order
            </button>
          </div>
        </form>
      </section>

      <style>{`
        select option{background:var(--vin-bg-shell);color:var(--vin-text-primary)}
        .field-input{width:100%;min-height:2.5rem;border-radius:0.375rem;border:1px solid rgb(143 178 191 / .34);background:transparent;padding:0.625rem 0.75rem;font-size:0.875rem;color:var(--vin-text-primary);outline:none;transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease}
        .field-input::placeholder{color:var(--vin-text-faint)}
        .field-input:focus{border-color:var(--vin-accent);background:rgb(8 31 42 / .18);box-shadow:0 0 0 2px rgb(24 185 208 / .12)}
        .field-input option{background:var(--vin-bg-shell);color:var(--vin-text-primary)}
        .field-textarea{width:100%;resize:none;border-radius:0.375rem;border:1px solid rgb(143 178 191 / .34);background:transparent;padding:0.625rem 0.75rem;font-size:0.875rem;line-height:1.55;color:var(--vin-text-primary);outline:none;transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease}
        .field-textarea::placeholder{color:var(--vin-text-faint)}
        .field-textarea:focus{border-color:var(--vin-accent);background:rgb(8 31 42 / .18);box-shadow:0 0 0 2px rgb(24 185 208 / .12)}
        .scr-dark::-webkit-scrollbar{width:5px;height:5px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:var(--vin-border-subtle);border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:var(--vin-border-strong)}
      `}</style>
    </div>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  const labelText = label.trim();
  const isRequired = labelText.endsWith("*");
  const displayLabel = isRequired ? labelText.slice(0, -1).trim() : labelText;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-vin-text2">
        {isRequired && <span className="text-red-300">*</span>}
        <span>{displayLabel}</span>
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-red-300">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function IconButton({
  children,
  danger,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-vin-status-danger-bg/50 bg-vin-status-danger-bg/15 text-red-200 hover:bg-vin-status-danger-bg/25"
          : "border-vin-border bg-vin-panel text-vin-text2 hover:border-vin-accent hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
