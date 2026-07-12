import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import Link from "next/link";
import { ArrowLeft, Camera, FileVideo, ImagePlus, Upload } from "lucide-react";
import NonDicomCaptureApp from "@/components/non-dicom/NonDicomCaptureApp";

import { hasPermission } from "@/lib/permissions";

const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
  });
};

export default async function NonDicomExamCapturePage({ params }: { params: { id: string } }) {
  const session = await requirePermission("nonDicom.read");

  const canCapture = hasPermission(session.role, "nonDicom.capture", session.permissions);
  const canDelete = hasPermission(session.role, "nonDicom.deleteMedia", session.permissions);

  const exam = await prisma.nonDicomExam.findUnique({
    where: { id: params.id },
    include: {
      imagingStudy: {
        select: {
          status: true,
          studyInstanceUid: true,
        },
      },
    },
  });

  if (!exam) return notFound();

  // Redirect to viewer if already finalized and has a study
  if (exam.status === "COMPLETED" && exam.imagingStudy) {
    // Actually we might just want to let them view it here, or disable uploading.
    // For now we will render it but pass a prop to disable capture.
  }

  return (
    <div className="flex h-screen flex-col bg-vin-root text-vin-text">
      {/* Header */}
      <header className="flex h-12 flex-none items-center justify-between border-b border-vin-border bg-vin-panel2 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/non-dicom"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-vin-muted transition hover:bg-vin-panel/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Hàng đợi
          </Link>
          <div className="h-4 w-[1px] bg-vin-panel/10" />
          <ScreenHeader />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="font-medium text-white">{exam.patientId}</span>
            <span className="text-[10px] text-vin-muted">
              ACC: {exam.accessionNumber}
            </span>
          </div>
          <div className="h-6 w-[1px] bg-vin-panel/10" />
          <div className="flex flex-col items-end">
            <span className="font-medium text-white">
              {exam.status === "CREATED" ? "Chưa có dữ liệu" : exam.status}
            </span>
            <span className="text-[10px] text-vin-muted">
              Bắt đầu: {formatDateTime(exam.createdAt)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <NonDicomCaptureApp
          examId={exam.id}
          isCompleted={exam.status === "COMPLETED"}
          canCapture={canCapture}
          canDelete={canDelete}
        />
      </main>
    </div>
  );
}
