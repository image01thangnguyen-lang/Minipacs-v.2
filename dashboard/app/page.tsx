"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { getStudies } from './actions';

// 1. Xử lý Tên Bệnh Nhân
const formatPatientName = (name?: string) => {
  if (!name) return "Unknown Patient";
  return name.replace(/\^/g, ' ');
};

// 2. Xử lý Ngày & Giờ chụp
const formatDicomDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "N/A";
  const d = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  let t = timeStr ? timeStr.substring(0, 4).replace(/(\d{2})(\d{2})/, '$1:$2') : "";
  return t ? `${d} ${t}` : d;
};

// 3. Component Badge Modality
const ModalityBadge = ({ type }: { type: string }) => {
  const modality = type || "UNKNOWN";
  let colors = "bg-zinc-900/50 text-zinc-400 border-white/[0.04]";
  
  if (modality === 'CT') colors = "bg-teal-950/20 text-teal-500/90 border-teal-950/40";
  else if (modality === 'MR') colors = "bg-blue-950/20 text-blue-500/90 border-blue-950/40";
  else if (['CR', 'DX'].includes(modality)) colors = "bg-orange-950/20 text-orange-500/90 border-orange-950/40";
  else if (modality === 'US') colors = "bg-emerald-950/20 text-emerald-500/90 border-emerald-950/40";

  return (
    <span className={`px-2 py-0.5 rounded font-mono text-xs font-semibold border ${colors}`}>
      {modality}
    </span>
  );
};

export default function DashboardPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  const ohifUrl = process.env.NEXT_PUBLIC_OHIF_URL || 'http://localhost:3000';

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getStudies();
        setStudies(data || []);
      } catch (err) {
        console.error("Failed to load studies", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalStudies = studies.length;
  const totalPages = Math.ceil(totalStudies / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentStudies = studies.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="min-h-screen bg-[#020203] text-zinc-300 p-8 sm:p-12 font-sans selection:bg-zinc-800 flex flex-col">
      <div className="w-full h-full flex flex-col flex-1">
        {/* Header Component - 1 Line, No Description */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-white/[0.04] mb-6 gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-200">
            Danh sách Ca chụp
          </h1>
          
          {/* Pagination Controls Sát vào lề phải */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label htmlFor="rows" className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                Rows per page:
              </label>
              <select
                id="rows"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#0A0A0C] border border-white/[0.04] text-zinc-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none min-w-[4rem] text-center cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="w-px h-6 bg-white/[0.04] hidden sm:block"></div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="p-1.5 border border-white/[0.04] rounded-lg bg-[#070708] text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading || totalStudies === 0}
                  className="p-1.5 border border-white/[0.04] rounded-lg bg-[#070708] text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client-Side Data Table */}
        <div className="bg-[#0A0A0C] border border-white/[0.04] rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-500 uppercase bg-[#070708] border-b border-white/[0.04] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider text-left">Accession</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-left">Bệnh Nhân</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-left">Modality</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-left min-w-[200px]">Mô tả</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-left">Ngày chụp</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-left">Trạng thái</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-center">Instances</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        <span className="font-medium text-sm">Đang tải dữ liệu ca chụp từ PACS...</span>
                      </div>
                    </td>
                  </tr>
                ) : studies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center text-slate-500">
                      Chưa có dữ liệu DICOM nào trên hệ thống. Hãy push DICOM từ máy siêu âm/X-Quang.
                    </td>
                  </tr>
                ) : (
                  currentStudies.map((study) => {
                    // Mapping Fields according to spec
                    const acc = study.MainDicomTags?.AccessionNumber || null;
                    const patientName = formatPatientName(study.PatientMainDicomTags?.PatientName);
                    const patientId = study.PatientMainDicomTags?.PatientID || "N/A";
                    const desc = study.MainDicomTags?.StudyDescription || "N/A";
                    const isStable = study.IsStable ?? true;
                    const studyDateTime = formatDicomDateTime(study.MainDicomTags?.StudyDate, study.MainDicomTags?.StudyTime);
                    const modality = study.EnrichedModality || "UNKNOWN";
                    const instances = study.EnrichedInstancesCount || 0;

                    const viewerLink = `${ohifUrl}/viewer?StudyInstanceUIDs=${study.MainDicomTags?.StudyInstanceUID}`;

                    return (
                      <tr key={study.ID} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-left">
                          <span className={acc ? "text-zinc-300 font-mono text-xs font-semibold" : "text-zinc-600 font-mono text-xs"}>
                            {acc || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-200 font-bold text-sm tracking-wide">{patientName}</span>
                            <span className="text-zinc-500 font-mono text-xs font-medium">PID-{patientId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <ModalityBadge type={modality} />
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm max-w-[200px] truncate" title={desc}>
                          {desc}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-sm font-mono whitespace-nowrap">
                          {studyDateTime}
                        </td>
                        <td className="px-6 py-4 text-left">
                          {isStable ? (
                            <span className="inline-flex items-center bg-emerald-950/20 text-emerald-400 border border-emerald-950/30 px-2 py-0.5 rounded text-xs font-medium tracking-wide">
                              Hoàn tất
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-950/20 text-amber-400 border border-amber-950/30 px-2 py-0.5 rounded text-xs font-medium tracking-wide">
                              Đang nhận
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="text-zinc-400 bg-zinc-900 border border-white/[0.04] px-2 py-0.5 rounded font-mono text-xs">
                             {instances}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            href={`/report/${study.MainDicomTags?.StudyInstanceUID}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg transition-all font-medium text-xs shadow-sm active:scale-95 outline-none whitespace-nowrap"
                          >
                            Đọc kết quả
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

