"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save, CheckCircle, Printer } from "lucide-react";
import { getStudies } from './actions';
import { getStudyDetails, getReport, upsertReport, getDefaultTemplate } from './report/[studyInstanceUid]/actions';
import TiptapEditor from './report/[studyInstanceUid]/components/TiptapEditor';
import { PrintTemplateViewer } from './report/[studyInstanceUid]/components/PrintTemplateViewer';
import { useReactToPrint } from 'react-to-print';

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
  
  // -- Report State --
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [reportStatus, setReportStatus] = useState<string>('UNREAD');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const handleReadReport = async (study: any) => {
    setSelectedStudy(study);
    const studyInstanceUid = study.MainDicomTags?.StudyInstanceUID;
    
    if (!studyInstanceUid) return;
    
    try {
      setIsReportLoading(true);
      
      // Reset form
      setFindings('');
      setConclusion('');
      setRecommendation('');
      setReportStatus('UNREAD');
      
      // Load report from PostgreSQL
      const report = await getReport(studyInstanceUid);
      if (report) {
        setFindings(report.findings || '');
        setConclusion(report.conclusion || '');
        setRecommendation(report.recommendation || '');
        setReportStatus(report.status);
      }

      // Load Patient info from Orthanc
      const studyInfo = await getStudyDetails(studyInstanceUid);
      if (studyInfo) {
        setPatientDetails(studyInfo);
      }

      const tmpl = await getDefaultTemplate();
      if (tmpl) {
        setTemplateHtml(tmpl);
      }
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleSave = async (status: 'DRAFTING' | 'COMPLETED') => {
    if (!selectedStudy?.MainDicomTags?.StudyInstanceUID) return;
    const studyInstanceUid = selectedStudy.MainDicomTags.StudyInstanceUID;
    setIsSaving(true);
    try {
      const res = await upsertReport(studyInstanceUid, {
        status,
        findings,
        conclusion,
        recommendation
      });
      if (res.success) {
        setReportStatus(status);
        // Also update the local studies list so the stable status updates immediately
        setStudies(prev => prev.map(s => {
          if (s.MainDicomTags?.StudyInstanceUID === studyInstanceUid) {
             return { ...s, IsStable: true }; // Optionally mark stable or read
          }
          return s;
        }));
      }
    } catch (err) {
      console.error("Failed to save report", err);
    } finally {
      setIsSaving(false);
    }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ket_Qua_CDHA_${selectedStudy?.MainDicomTags?.StudyInstanceUID || ''}`,
  });

  const totalStudies = studies.length;
  const totalPages = Math.ceil(totalStudies / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentStudies = studies.slice(startIndex, startIndex + rowsPerPage);

  // === RENDER: REPORT SPLIT VIEW ===
  if (selectedStudy) {
    if (isReportLoading) {
      return (
        <div className="h-screen w-full bg-[#020203] flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      );
    }

    const patientName = formatPatientName(patientDetails?.PatientMainDicomTags?.PatientName || selectedStudy?.PatientMainDicomTags?.PatientName);
    const patientId = patientDetails?.PatientMainDicomTags?.PatientID || selectedStudy?.PatientMainDicomTags?.PatientID || "N/A";
    const studyDesc = patientDetails?.MainDicomTags?.StudyDescription || selectedStudy?.MainDicomTags?.StudyDescription || "N/A";
    const studyDate = formatDicomDateTime(patientDetails?.MainDicomTags?.StudyDate || selectedStudy?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime || selectedStudy?.MainDicomTags?.StudyTime);
    const studyInstanceUid = selectedStudy.MainDicomTags?.StudyInstanceUID;
    
    // OHIF Fix URL
    const viewerLink = `${ohifUrl}/viewer?StudyInstanceUIDs=${studyInstanceUid}`;

    return (
      <div className="h-screen w-full bg-[#0a0e17] text-zinc-300 overflow-hidden flex flex-col sm:flex-row">
        {/* BÊN TRÁI (7 phần): Khu vực OHIF Viewer */}
        <div className="w-full sm:w-7/12 h-[50vh] sm:h-full bg-[#0a0e17] relative border-b sm:border-b-0">
           <iframe 
             src={viewerLink}
             title="OHIF Viewer"
             className="w-full h-full border-none"
             allowFullScreen
           />
        </div>

        {/* BÊN PHẢI (5 phần): Khu vực RIS Report Form (SÁNG) */}
        <div className="w-full sm:w-5/12 h-[50vh] sm:h-full flex flex-col bg-[#f1f5f9] sm:border-l sm:border-zinc-800">
          {/* Header Thông tin bệnh nhân */}
          <div className="flex-none p-4 border-b border-slate-200 bg-white">
             <div className="flex items-start justify-between">
                <div>
                  <button 
                    onClick={() => setSelectedStudy(null)}
                    className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors mb-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
                  </button>
                  <h2 className="text-xl font-bold text-slate-900 tracking-wide">{patientName}</h2>
                  <div className="text-xs font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                     <span>PID: <span className="text-slate-700">{patientId}</span></span>
                     <span>Study: <span className="text-slate-700">{studyDesc}</span></span>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                     reportStatus === 'COMPLETED' || reportStatus === 'FINAL' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                     reportStatus === 'DRAFTING' || reportStatus === 'DRAFT' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                     'bg-slate-100 text-slate-600 border-slate-200'
                   }`}>
                     {reportStatus}
                   </span>
                   <div className="text-xs font-mono text-slate-500 mt-2">{studyDate}</div>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-slate-900">
             {/* Section 1: Findings (Rich Text Editor) */}
             <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-semibold text-slate-600 flex items-center justify-between">
                   Mô tả (Findings)
                   <span className="text-[10px] text-slate-400 font-mono font-normal">Hỗ trợ Paste/Drop Ảnh</span>
                </label>
                <div className="bg-white border border-slate-200 text-black shadow-sm rounded-xl p-6 min-h-[350px]">
                   <TiptapEditor value={findings} onChange={setFindings} />
                </div>
             </div>

             {/* Section 2: Conclusion */}
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Kết luận (Conclusion)</label>
                <textarea 
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none custom-scrollbar shadow-sm"
                  placeholder="Nhập kết luận ngắn gọn..."
                />
             </div>

             {/* Section 3: Recommendation */}
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Đề nghị (Recommendation)</label>
                <textarea 
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none custom-scrollbar shadow-sm"
                  placeholder="Đề nghị các chỉ định lâm sàng tiếp theo..."
                />
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-none p-4 border-t border-slate-200 bg-white flex items-center justify-between">
             <div>
               <button
                 onClick={() => handlePrint()}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
               >
                 <Printer className="h-4 w-4" />
                 In Kết Quả
               </button>
             </div>
             <div className="flex items-center gap-3">
               <button
                 onClick={() => handleSave('DRAFTING')}
                 disabled={isSaving}
                 className="px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
               >
                 <Save className="h-4 w-4" />
                 Lưu nháp
               </button>
               <button
                 onClick={() => handleSave('COMPLETED')}
                 disabled={isSaving}
                 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-sm"
               >
                 <CheckCircle className="h-4 w-4" />
                 Hoàn tất & Ký
               </button>
             </div>
          </div>
        </div>

        {/* Hidden Print Template */}
        <div className="hidden">
          <PrintTemplateViewer 
            ref={printRef}
            templateHtml={templateHtml}
            context={{
              patientName: patientName,
              patientId: patientId,
              studyDate: studyDate,
              studyDesc: studyDesc,
              reportContent: findings,
              conclusion: conclusion,
              recommendation: recommendation
            }}
          />
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
    );
  }

  // === RENDER: DASHBOARD ===
  return (
    <div className="min-h-screen bg-[#0a0e17] text-zinc-300 p-8 sm:p-12 font-sans selection:bg-zinc-800 flex flex-col">
      <div className="w-full h-full flex flex-col flex-1">
        {/* Header Component - 1 Line, No Description */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-white/[0.04] mb-6 gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
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
                    const acc = study.MainDicomTags?.AccessionNumber || null;
                    const patientName = formatPatientName(study.PatientMainDicomTags?.PatientName);
                    const patientId = study.PatientMainDicomTags?.PatientID || "N/A";
                    const desc = study.MainDicomTags?.StudyDescription || "N/A";
                    const isStable = study.IsStable ?? true;
                    const studyDateTime = formatDicomDateTime(study.MainDicomTags?.StudyDate, study.MainDicomTags?.StudyTime);
                    const modality = study.EnrichedModality || "UNKNOWN";
                    const instances = study.EnrichedInstancesCount || 0;

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
                          <button 
                            onClick={() => handleReadReport(study)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg transition-all font-medium text-xs shadow-sm active:scale-95 outline-none whitespace-nowrap"
                          >
                            Đọc kết quả
                          </button>
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
