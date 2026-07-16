"use client";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";


import { useState, useEffect, useRef } from "react";
import { Loader2, Send, Users, Video, LogOut, CheckCircle, XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import {
  getConsultationByIdAction,
  sendConsultationMessageAction,
  updateConsultationStatusAction,
  updateParticipantStatusAction
} from "../actions";
import Link from "next/link";
import { useSession } from "next-auth/react";

const statusLabels: Record<string, string> = {
  REQUESTED: "Đã yêu cầu",
  ACTIVE: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

export default function ConsultationRoomPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [consultation, setConsultation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = (session?.user as any)?.id;

  const loadConsultation = async () => {
    try {
      const res = await getConsultationByIdAction(params.id);
      if (res.success) {
        setConsultation(res.consultation);
      } else {
        setError(res.error || "Không thể tải thông tin hội chẩn.");
      }
    } catch (err: any) {
      setError("Lỗi kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsultation();
    // Poll every 5 seconds for new messages
    const interval = setInterval(loadConsultation, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consultation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const res = await sendConsultationMessageAction(params.id, message.trim());
      if (res.success) {
        setMessage("");
        loadConsultation();
      } else {
        alert(res.error || "Không thể gửi tin nhắn.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển trạng thái thành ${statusLabels[status]}?`)) return;
    try {
      const res = await updateConsultationStatusAction(params.id, status);
      if (res.success) {
        loadConsultation();
      } else {
        alert(res.error || "Không thể cập nhật trạng thái.");
      }
    } catch (e) {
      alert("Lỗi hệ thống.");
    }
  };

  if (isLoading && !consultation) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
        <div className="flex flex-1 items-center justify-center text-vin-muted">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-vin-accent" />
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
        <div className="flex flex-1 items-center justify-center text-red-400">
          {error || "Không tìm thấy hội chẩn"}
        </div>
      </div>
    );
  }

  const isOwner = consultation.createdByUserId === currentUserId;
  const isParticipant = consultation.participants.some((p: any) => p.userId === currentUserId);

  // OHIF link calculation
  let ohifLink = "";
  if (consultation.sourceType === "DICOM" && consultation.studyInstanceUid) {
    // Determine the host for OHIF viewer
    const host = window.location.origin;
    ohifLink = `${host}/viewer/minipacs?StudyInstanceUIDs=${consultation.studyInstanceUid}`;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      <section className="flex h-full min-w-0 flex-1 flex-col bg-vin-shell">
        <header className="flex h-14 flex-none items-center justify-between border-b border-vin-border/70 bg-vin-panel px-4">
          <div className="flex items-center gap-3">
            <Link href="/consultations" className="rounded p-1.5 text-vin-muted transition hover:bg-white/5 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <ScreenHeader />
            <span className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold ${
              consultation.status === 'ACTIVE' ? 'bg-indigo-500 text-white' :
              consultation.status === 'COMPLETED' ? 'bg-vin-status-approved-bg text-white' :
              'bg-vin-shell border border-vin-border text-vin-text2'
            }`}>
              {statusLabels[consultation.status] || consultation.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && consultation.status === "REQUESTED" && (
              <button onClick={() => updateStatus("ACTIVE")} className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600">
                <Video className="h-3.5 w-3.5" /> Bắt đầu
              </button>
            )}
            {isOwner && consultation.status === "ACTIVE" && (
              <button onClick={() => updateStatus("COMPLETED")} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" /> Kết thúc
              </button>
            )}
            {isOwner && (consultation.status === "REQUESTED" || consultation.status === "ACTIVE") && (
              <button onClick={() => updateStatus("CANCELLED")} className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/30">
                <XCircle className="h-3.5 w-3.5" /> Hủy bỏ
              </button>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 overflow-hidden">
          {/* Main workspace - Viewer if available, else info */}
          <div className="flex flex-1 flex-col border-r border-vin-border bg-black">
            {ohifLink ? (
              <iframe src={ohifLink} className="h-full w-full border-none" title="OHIF Viewer" allowFullScreen />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-vin-muted">
                <Video className="mb-4 h-12 w-12 text-vin-faint" />
                <h2 className="text-lg font-bold text-vin-text2">Phòng hội chẩn</h2>
                <p className="mt-2 text-sm max-w-md">
                  {consultation.description || "Không có mô tả cho ca hội chẩn này."}
                </p>
                {consultation.sourceType === "NON_DICOM" && (
                  <Link href={`/non-dicom/${consultation.nonDicomExamId || consultation.nonDicomId}`} className="mt-4 rounded bg-vin-panel border border-vin-border px-4 py-2 text-vin-accent hover:bg-white/5 transition">
                    Mở ca Non-DICOM gốc
                  </Link>
                )}
                {consultation.sourceType === "REPORT" && (
                  <Link href={`/report/${consultation.studyInstanceUid}`} className="mt-4 rounded bg-vin-panel border border-vin-border px-4 py-2 text-vin-accent hover:bg-white/5 transition">
                    Xem Báo cáo gốc
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Chat and Participants */}
          <aside className="flex w-[320px] flex-col bg-vin-panel">
            <div className="flex-none border-b border-vin-border p-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-vin-muted">
                <Users className="h-3.5 w-3.5" /> Người tham gia ({consultation.participants.length})
              </h3>
              <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto scr-dark">
                {consultation.participants.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-vin-text2">{p.user.fullName || p.user.username}</span>
                    <span className={`text-sm ${p.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-vin-muted'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scr-dark">
              <div className="space-y-4">
                {consultation.messages.length === 0 ? (
                  <div className="text-center text-sm text-vin-muted">Chưa có tin nhắn.</div>
                ) : (
                  consultation.messages.map((m: any) => {
                    const isMe = m.senderUserId === currentUserId;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="text-sm text-vin-muted mb-1">{m.senderDisplayName}</div>
                        <div className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] ${
                          isMe ? 'bg-vin-accent text-white rounded-tr-none' : 'bg-vin-shell border border-vin-border text-vin-text2 rounded-tl-none'
                        }`}>
                          {m.body}
                        </div>
                        <div className="text-sm text-vin-faint mt-1">
                          {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="flex-none border-t border-vin-border bg-vin-shell p-3">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="max-h-24 min-h-[40px] w-full resize-none rounded-xl border border-white/10 bg-vin-root px-3 py-2.5 text-sm text-white outline-none transition focus:border-vin-accent scr-dark"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isSending || consultation.status === "COMPLETED" || consultation.status === "CANCELLED"}
                />
                <button
                  type="submit"
                  disabled={isSending || !message.trim() || consultation.status === "COMPLETED" || consultation.status === "CANCELLED"}
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-vin-accent text-white transition hover:bg-vin-accentHover disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </aside>
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
