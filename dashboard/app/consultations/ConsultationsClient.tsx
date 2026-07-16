"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import { useState, useEffect } from "react";
import { Loader2, RefreshCcw, Users, Search, Video, Calendar, ArrowRight } from "lucide-react";
import { getConsultationsAction, updateParticipantStatusAction } from "./actions";
import Link from "next/link";
import { CustomSelect } from "@/app/components/CustomSelect";
import { ConsultationDataGrid } from "./ConsultationDataGrid";
import { statusLabels, statusClasses } from "./utils";
import type { ConsultationView } from "./utils";

export function ConsultationsClient() {
  const [consultations, setConsultations] = useState<ConsultationView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadConsultations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters = statusFilter !== "ALL" ? { status: statusFilter } : {};
      const res = await getConsultationsAction(filters);
      if (res.success) {
        setConsultations(res.consultations);
      } else {
        setError(res.error || "Không thể tải danh sách hội chẩn.");
      }
    } catch (err: any) {
      setError("Lỗi kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Hội chẩn - Danh sách";
    loadConsultations();
  }, [statusFilter]);

  const joinConsultation = async (consultationId: string, userId: string, currentStatus: string) => {
    if (currentStatus === "INVITED") {
      // Mark as accepted when joining
      await updateParticipantStatusAction(consultationId, userId, "ACCEPTED");
    }
    window.location.href = `/consultations/${consultationId}`;
  };

  const enableSharedUI = process.env.NEXT_PUBLIC_ENABLE_CONSULTATIONS_SHARED_UI === "true";

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <section className="flex h-full min-w-0 flex-1 flex-col bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <ScreenHeader />
              <div className="mt-1 text-sm text-vin-muted">{consultations.length} cuộc hội chẩn</div>
            </div>
            <button
              type="button"
              onClick={loadConsultations}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-vin-border bg-vin-panel px-3 py-1.5 text-sm font-semibold text-vin-text2 transition hover:border-vin-accent hover:text-white disabled:opacity-40"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <div className="w-48">
              <CustomSelect
                options={[
                  { value: "ALL", label: "Tất cả trạng thái" },
                  { value: "REQUESTED", label: "Đã yêu cầu" },
                  { value: "ACTIVE", label: "Đang diễn ra" },
                  { value: "COMPLETED", label: "Đã kết thúc" },
                  { value: "CANCELLED", label: "Đã hủy" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                compact
              />
            </div>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-auto p-4 scr-dark">
          {error && (
            <div role="alert" aria-live="polite" className="mb-4 rounded border border-vin-status-danger-bg/60 bg-vin-status-danger-bg/15 px-3 py-2 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-vin-muted">
              <Loader2 className="mb-2 h-5 w-5 animate-spin text-vin-accent" />
              Đang tải danh sách...
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-vin-muted">
              <Users className="mb-3 h-8 w-8 text-vin-faint" />
              <div className="text-sm font-semibold text-vin-text2">Không có cuộc hội chẩn nào.</div>
            </div>
          ) : enableSharedUI ? (
            <ConsultationDataGrid rows={consultations} isLoading={isLoading} />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {consultations.map(c => (
                <div key={c.id} className="flex flex-col rounded-xl border border-vin-border bg-vin-panel shadow-sm transition hover:border-vin-accent/50">
                  <div className="flex items-center justify-between border-b border-white/5 p-4">
                    <div>
                      <h3 className="font-bold text-white">{c.title || "Hội chẩn ca chụp"}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-vin-text2">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold ${statusClasses[c.status] || "bg-vin-shell text-vin-text2"}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </div>

                  <div className="flex-1 p-4 text-sm text-vin-text2">
                    <p className="line-clamp-2">{c.description || "Không có mô tả"}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-sm">
                      <div>
                        <span className="text-vin-muted">Người tạo: </span>
                        <span className="font-semibold text-white">{c.createdByUser?.fullName || c.createdByUser?.username || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-vin-muted" />
                        <span>{c.participants.length} tham gia</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 p-3">
                    <Link
                      href={`/consultations/${c.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-vin-accent/20 px-4 py-2 text-sm font-semibold text-vin-accent transition hover:bg-vin-accent hover:text-white"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Vào phòng hội chẩn
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </section>
      <style>{`
        .scr-dark::-webkit-scrollbar { width: 5px; height: 5px; }
        .scr-dark::-webkit-scrollbar-track { background: transparent; }
        .scr-dark::-webkit-scrollbar-thumb { background: var(--vin-border-subtle); border-radius: 10px; }
        .scr-dark::-webkit-scrollbar-thumb:hover { background: var(--vin-border-strong); }
      `}</style>
    </div>
  );
}
