"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, Upload, CheckCircle2, Image as ImageIcon, Video, Trash2, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  status: string;
  originalFilename: string;
  createdAt: string;
}

export default function NonDicomCaptureApp({ examId, isCompleted, canCapture = true, canDelete = true }: { examId: string; isCompleted: boolean; canCapture?: boolean; canDelete?: boolean }) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadMedia = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/non-dicom/${examId}/media`);
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách media:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [examId]);

  useEffect(() => {
    if (activeTab === "camera" && !isCompleted && canCapture) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, isCompleted, canCapture]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(mediaStream);
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setHasCamera(false);
      setCameraError(err.message || "Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !stream) return;

    setIsCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d context");

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));

      if (!blob) throw new Error("Could not create image blob");

      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadFiles([file]);

      // Visual feedback
      const flash = document.createElement("div");
      flash.className = "absolute inset-0 bg-white z-50 animate-pulse";
      videoRef.current.parentElement?.appendChild(flash);
      setTimeout(() => flash.remove(), 200);

    } catch (err: any) {
      alert(`Lỗi chụp ảnh: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const res = await fetch(`/api/non-dicom/${examId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${res.status}`);
      }

      alert(`Đã tải lên ${files.length} tệp thành công.`);
      loadMedia();
    } catch (err: any) {
      alert(`Lỗi tải lên: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
    }
  };

  const finalizeExam = async () => {
    if (mediaList.length === 0) {
      alert("Vui lòng chụp hoặc tải lên ít nhất 1 ảnh/video trước khi hoàn thành.");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn hoàn thành ca chụp này? Không thể thêm ảnh sau khi hoàn thành.")) {
      return;
    }

    try {
      const res = await fetch(`/api/non-dicom/${examId}/finalize`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to finalize");

      alert("Đã hoàn thành ca chụp.");
      router.push("/non-dicom");
      router.refresh();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm("Xóa tệp này?")) return;

    try {
      const res = await fetch(`/api/non-dicom/${examId}/media/${mediaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setMediaList(prev => prev.filter(m => m.id !== mediaId));
      alert("Đã xóa tệp.");
    } catch (err: any) {
      alert(`Lỗi xóa tệp: ${err.message}`);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Workspace (Left) */}
      <div className="flex flex-1 flex-col border-r border-vin-border bg-vin-panel">
        {!isCompleted && canCapture && (
          <div className="flex flex-none gap-1 border-b border-white/5 p-2">
            <button
              onClick={() => setActiveTab("camera")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "camera"
                  ? "bg-vin-accent text-white"
                  : "bg-vin-panel2 text-vin-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Camera className="h-4 w-4" />
              Chụp Camera
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "upload"
                  ? "bg-vin-accent text-white"
                  : "bg-vin-panel2 text-vin-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Upload className="h-4 w-4" />
              Tải lên Tệp
            </button>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden bg-black p-4 flex items-center justify-center">
          {isCompleted ? (
            <div className="text-center text-vin-muted">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
              <p className="text-lg font-medium text-white">Ca chụp đã hoàn thành</p>
              <p className="text-sm">Không thể thêm dữ liệu mới.</p>
            </div>
          ) : !canCapture ? (
            <div className="text-center text-vin-muted">
              <p className="text-lg font-medium text-white">Chế độ Xem</p>
              <p className="text-sm">Bạn không có quyền thu nhận hình ảnh cho ca chụp này.</p>
            </div>
          ) : activeTab === "camera" ? (
            <div className="relative flex h-full w-full flex-col items-center justify-center">
              {hasCamera === false ? (
                <div className="text-center text-red-400 p-4 border border-red-500/30 rounded bg-red-500/10">
                  <p className="font-semibold mb-2">Lỗi Camera</p>
                  <p className="text-sm">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full rounded-lg bg-black object-contain shadow-2xl"
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button
                      onClick={captureImage}
                      disabled={!hasCamera || isCapturing}
                      className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 p-2 backdrop-blur transition hover:bg-white/30 disabled:opacity-50"
                    >
                      <div className="h-full w-full rounded-full bg-white transition group-active:scale-95" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 p-8 text-center transition hover:border-vin-accent/50 hover:bg-vin-accentSoft/5">
              <Upload className="mb-4 h-12 w-12 text-vin-muted" />
              <p className="mb-2 text-lg font-medium text-white">Tải lên Ảnh / Video / PDF</p>
              <p className="mb-6 text-sm text-vin-muted">Kéo thả tệp vào đây hoặc click để chọn tệp</p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded bg-vin-accent px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-vin-accentHover"
              >
                {isUploading ? "Đang tải lên..." : "Chọn Tệp"}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Sidebar (Right) */}
      <div className="flex w-80 flex-none flex-col bg-vin-panel2">
        <div className="flex h-12 flex-none items-center justify-between border-b border-vin-border px-4">
          <h2 className="text-sm font-semibold text-white">Thư viện ({mediaList.length})</h2>
          <button
            onClick={loadMedia}
            disabled={isRefreshing}
            className="p-1 text-vin-muted hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 scr-dark">
          {mediaList.length === 0 ? (
            <div className="py-8 text-center text-sm text-vin-muted">
              Chưa có dữ liệu nào.
            </div>
          ) : (
            mediaList.map(item => (
              <div key={item.id} className="group relative flex flex-col rounded-lg border border-white/10 bg-vin-panel overflow-hidden">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  {item.type === "IMAGE" ? (
                    <img
                      src={`/api/non-dicom/${examId}/media/${item.id}`}
                      alt={item.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === "VIDEO" ? (
                    <div className="flex flex-col items-center text-vin-muted">
                      <Video className="h-8 w-8 mb-2" />
                      <span className="text-xs">Video</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-vin-muted">
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <span className="text-xs">Tài liệu</span>
                    </div>
                  )}

                  {!isCompleted && canDelete && (
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="p-2 text-xs">
                  <div className="truncate font-medium text-white" title={item.originalFilename}>
                    {item.originalFilename}
                  </div>
                  <div className="mt-1 text-[10px] text-vin-muted">
                    {new Date(item.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isCompleted && canCapture && (
          <div className="border-t border-vin-border bg-vin-panel p-4">
            <button
              onClick={finalizeExam}
              disabled={mediaList.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Hoàn thành ca chụp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
