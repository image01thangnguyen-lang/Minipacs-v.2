"use client";

import { useState, useEffect } from "react";
import { Loader2, Lock, FileText, Image as ImageIcon, ExternalLink, Calendar, User, FileImage } from "lucide-react";

export default function PublicSharePage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState("");
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [inputPwd, setInputPwd] = useState("");

  const fetchContext = async (pwd?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/share/${params.token}/context`, {
        headers: { "x-share-password": pwd || password }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && data.error === "Password required") {
          setContext({ requiresPassword: true });
        } else if (res.status === 401 && data.error === "Invalid password") {
          setError("Mật khẩu không đúng.");
          setContext({ requiresPassword: true });
        } else {
          setError(data.error || "Không thể truy cập liên kết");
        }
      } else {
        setContext(data);
        if (pwd) setPassword(pwd);
      }
    } catch (e) {
      setError("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-vin-root text-vin-muted">
        <Loader2 className="h-8 w-8 animate-spin text-vin-accent" />
      </div>
    );
  }

  if (context?.requiresPassword && !context?.scope) {
    return (
      <div className="flex h-screen items-center justify-center bg-vin-root p-4 font-sans">
        <div className="w-full max-w-sm rounded-2xl border border-vin-border bg-vin-panel p-6 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vin-accent/20">
              <Lock className="h-6 w-6 text-vin-accent" />
            </div>
            <h1 className="text-lg font-bold text-white">Liên kết được bảo vệ</h1>
            <p className="mt-2 text-sm text-vin-text2">
              Vui lòng nhập mật khẩu để xem nội dung chia sẻ.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchContext(inputPwd);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={inputPwd}
                onChange={(e) => setInputPwd(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-vin-shell px-4 py-2.5 text-sm text-vin-text outline-none transition placeholder:text-vin-faint focus:border-vin-accent focus:bg-vin-root/50"
                autoFocus
              />
            </div>
            {error && <div className="text-center text-sm font-semibold text-red-400">{error}</div>}
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-vin-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover"
            >
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="flex h-screen items-center justify-center bg-vin-root p-4">
        <div className="max-w-md rounded-xl border border-vin-border bg-vin-panel p-6 text-center text-sm text-red-400 shadow-xl">
          {error || "Không tìm thấy dữ liệu"}
        </div>
      </div>
    );
  }

  const { studyInstanceUid, scope, allowReport, allowImages, patientName, patientId, studyDate, accessionNumber, reportData } = context;

  const viewerLink = `/viewer/minipacs?configUrl=/api/share/${params.token}/ohif-config&StudyInstanceUIDs=${studyInstanceUid}`;

  return (
    <div className="flex min-h-screen flex-col bg-vin-root font-sans text-vin-text">
      <header className="flex h-14 items-center justify-between border-b border-vin-border bg-vin-panel2 px-6">
        <div className="flex items-center gap-2 font-semibold text-white">
          <ImageIcon className="h-5 w-5 text-vin-accent" />
          MiniPACS Share Viewer
        </div>
        <div className="text-sm text-vin-muted">Bản xem trước công khai</div>
      </header>

      <main className="flex-1 p-6 sm:p-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-vin-border bg-vin-panel p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <User className="h-5 w-5 text-vin-text2" />
              Thông tin ca chụp
            </h2>

            {patientName ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide text-vin-muted">Bệnh nhân</div>
                  <div className="mt-1 text-base font-semibold text-white">{patientName}</div>
                  <div className="text-sm font-mono text-vin-text2">{patientId}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide text-vin-muted">Ngày chụp</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-vin-text2">
                    <Calendar className="h-4 w-4" />
                    {studyDate ? new Date(studyDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")).toLocaleDateString("vi-VN") : "-"}
                  </div>
                  {accessionNumber && (
                    <div className="mt-1 text-sm font-mono text-vin-text2">ACC: {accessionNumber}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm italic text-vin-muted">Thông tin bệnh nhân đã được ẩn bảo mật.</div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {allowImages && (
              <div className="flex flex-col justify-between rounded-2xl border border-vin-border bg-vin-panel p-6 shadow-xl">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-white">
                    <FileImage className="h-5 w-5 text-indigo-400" />
                    Hình ảnh DICOM
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-vin-text2">
                    Xem toàn bộ hình ảnh DICOM của ca chụp bằng trình xem chuẩn y tế.
                  </p>
                </div>
                <a
                  href={viewerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-vin-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-vin-accentHover"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mở Trình xem ảnh
                </a>
              </div>
            )}

            {allowReport && (
              <div className="flex flex-col justify-between rounded-2xl border border-vin-border bg-vin-panel p-6 shadow-xl">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-white">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    Kết quả chẩn đoán
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-vin-text2">
                    Báo cáo kết quả và kết luận chẩn đoán hình ảnh từ bác sĩ.
                  </p>
                </div>
                {/* Render report inline if data exists */}
                {reportData ? (
                  <div className="mt-6 space-y-4 rounded-xl border border-vin-border bg-black/20 p-4 text-sm text-vin-text2">
                    <div>
                      <div className="font-bold uppercase text-vin-muted mb-1 text-sm">Mô tả</div>
                      <div className="whitespace-pre-wrap">{reportData.findings || "-"}</div>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-vin-muted mb-1 text-sm">Kết luận</div>
                      <div className="whitespace-pre-wrap">{reportData.conclusion || "-"}</div>
                    </div>
                    {reportData.recommendation && (
                      <div>
                        <div className="font-bold uppercase text-vin-muted mb-1 text-sm">Đề nghị</div>
                        <div className="whitespace-pre-wrap">{reportData.recommendation}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    disabled
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-vin-border bg-vin-shell px-4 py-2.5 text-sm font-semibold text-vin-faint opacity-60"
                  >
                    <FileText className="h-4 w-4" />
                    Chưa có Phiếu kết quả
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
