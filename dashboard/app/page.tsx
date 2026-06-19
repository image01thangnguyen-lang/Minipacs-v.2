"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save, CheckCircle, Printer, Image as ImageIcon } from "lucide-react";
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

  const handleDoubleClickRow = (study: any) => {
    const studyInstanceUid = study.MainDicomTags?.StudyInstanceUID;
    if (studyInstanceUid) {
      const viewerLink = `${ohifUrl}/viewer?StudyInstanceUIDs=${studyInstanceUid}`;
      window.open(viewerLink, '_blank');
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
        // Cập nhật local studies list
        setStudies(prev => prev.map(s => {
          if (s.MainDicomTags?.StudyInstanceUID === studyInstanceUid) {
             return { ...s, IsStable: true };
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

  // Variables for Report Form
  const patientName = formatPatientName(patientDetails?.PatientMainDicomTags?.PatientName || selectedStudy?.PatientMainDicomTags?.PatientName);
  const patientId = patientDetails?.PatientMainDicomTags?.PatientID || selectedStudy?.PatientMainDicomTags?.PatientID || "N/A";
  const studyDesc = patientDetails?.MainDicomTags?.StudyDescription || selectedStudy?.MainDicomTags?.StudyDescription || "N/A";
  const studyDate = formatDicomDateTime(patientDetails?.MainDicomTags?.StudyDate || selectedStudy?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime || selectedStudy?.MainDicomTags?.StudyTime);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0e17] font-sans selection:bg-zinc-800">
      
      {/* ========================================= */}
      {/* CỘT TRÁI (55%): DANH SÁCH CA CHỤP */}
      {/* ========================================= */}
      <div className="w-[55%] h-full flex flex-col bg-[#0a0e17] text-zinc-300 border-r border-zinc-800">
        
        {/* Header List */}
        <div className="flex-none p-5 pb-4 border-b border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Danh sách Ca chụp
          </h1>
          
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

        {/* Bảng dữ liệu */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-4">
          <div className="bg-[#0A0A0C] border border-white/[0.04] rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] font-bold text-zinc-500 uppercase bg-[#070708] border-b border-white/[0.04] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 tracking-wider text-left">Bệnh Nhân</th>
                  <th className="px-4 py-3 tracking-wider text-left">Modality</th>
                  <th className="px-4 py-3 tracking-wider text-left max-w-[150px]">Mô tả</th>
                  <th className="px-4 py-3 tracking-wider text-left">Ngày chụp</th>
                  <th className="px-4 py-3 tracking-wider text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                        <span className="font-medium text-sm">Đang tải dữ liệu ca chụp...</span>
                      </div>
                    </td>
                  </tr>
                ) : studies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                      Chưa có dữ liệu DICOM nào trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  currentStudies.map((study) => {
                    const patientNameStr = formatPatientName(study.PatientMainDicomTags?.PatientName);
                    const patientIdStr = study.PatientMainDicomTags?.PatientID || "N/A";
                    const desc = study.MainDicomTags?.StudyDescription || "N/A";
                    const isStable = study.IsStable ?? true;
                    const studyDateTime = formatDicomDateTime(study.MainDicomTags?.StudyDate, study.MainDicomTags?.StudyTime);
                    const modality = study.EnrichedModality || "UNKNOWN";
                    const isSelected = selectedStudy?.MainDicomTags?.StudyInstanceUID === study.MainDicomTags?.StudyInstanceUID;

                    return (
                      <tr 
                        key={study.ID} 
                        onClick={() => handleReadReport(study)}
                        onDoubleClick={() => handleDoubleClickRow(study)}
                        className={`transition-colors group cursor-pointer select-none ${
                          isSelected ? 'bg-zinc-800/50' : 'hover:bg-white/[0.02]'
                        }`}
                        title="Click để đọc kết quả. Double-click để mở OHIF Viewer."
                      >
                        <td className="px-4 py-3 text-left">
                          <div className="flex flex-col gap-0.5">
                            <span className={`font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                              {patientNameStr}
                            </span>
                            <span className="text-zinc-500 font-mono text-[10px] font-medium">PID-{patientIdStr}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-left">
                          <ModalityBadge type={modality} />
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs max-w-[150px] truncate" title={desc}>
                          {desc}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[11px] font-mono whitespace-nowrap">
                          {studyDateTime}
                        </td>
                        <td className="px-4 py-3 text-left">
                          {isStable ? (
                            <span className="inline-flex items-center bg-emerald-950/20 text-emerald-400 border border-emerald-950/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                              Hoàn tất
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-950/20 text-amber-400 border border-amber-950/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                              Đang nhận
                            </span>
                          )}
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

      {/* ========================================= */}
      {/* CỘT PHẢI (45%): FORM BÁO CÁO (LIGHT THEME)*/}
      {/* ========================================= */}
      <div className="w-[45%] h-full flex flex-col bg-[#f8fafc] text-slate-900 relative">
        
        {!selectedStudy ? (
          // TRẠNG THÁI RỖNG
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
             <div className="w-20 h-20 mb-6 bg-slate-200 rounded-full flex items-center justify-center shadow-inner">
                <ImageIcon className="h-10 w-10 text-slate-400" />
             </div>
             <h3 className="text-xl font-semibold text-slate-700 mb-2">Chưa chọn ca chụp</h3>
             <p className="max-w-[280px] text-sm leading-relaxed">
               Click vào một ca chụp từ danh sách bên trái để viết kết quả.<br/>
               Double-click để mở OHIF Viewer trên tab mới.
             </p>
          </div>
        ) : isReportLoading ? (
          // TRẠNG THÁI ĐANG TẢI
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#f8fafc] z-10">
             <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
             <span className="text-slate-500 font-medium">Đang tải thông tin bệnh án...</span>
          </div>
        ) : (
          // FORM NHẬP KẾT QUẢ
          <>
            {/* Header Thông tin bệnh nhân */}
            <div className="flex-none p-5 border-b border-slate-200 bg-white shadow-sm z-10">
               <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-wide uppercase">{patientName}</h2>
                    <div className="text-xs font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                       <span>PID: <span className="text-slate-700 font-semibold">{patientId}</span></span>
                       <span>Chỉ định: <span className="text-slate-700 font-semibold">{studyDesc}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border ${
                       reportStatus === 'COMPLETED' || reportStatus === 'FINAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                       reportStatus === 'DRAFTING' || reportStatus === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                       'bg-slate-100 text-slate-600 border-slate-200'
                     }`}>
                       {reportStatus}
                     </span>
                     <div className="text-[11px] font-mono text-slate-500 mt-2.5">{studyDate}</div>
                  </div>
               </div>
            </div>

            {/* Nội dung báo cáo */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-light">
               
               {/* Section 1: Findings (Rich Text Editor - Giấy A4) */}
               <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                     Mô tả (Findings)
                     <span className="text-[10px] text-slate-400 font-mono font-normal bg-slate-100 px-2 py-0.5 rounded">Hỗ trợ Paste/Drop Ảnh</span>
                  </label>
                  <div className="bg-white border border-slate-200 text-black shadow-sm rounded-xl p-6 min-h-[350px] transition-all hover:shadow-md">
                     <TiptapEditor value={findings} onChange={setFindings} />
                  </div>
               </div>

               {/* Section 2: Conclusion */}
               <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Kết luận (Conclusion)</label>
                  <textarea 
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none custom-scrollbar-light shadow-sm"
                    placeholder="Nhập kết luận ngắn gọn..."
                  />
               </div>

               {/* Section 3: Recommendation */}
               <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Đề nghị (Recommendation)</label>
                  <textarea 
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none custom-scrollbar-light shadow-sm"
                    placeholder="Đề nghị các chỉ định lâm sàng tiếp theo..."
                  />
               </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-5 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 flex items-center justify-between">
               <div>
                 <button
                   onClick={() => handlePrint()}
                   className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                 >
                   <Printer className="h-4 w-4" />
                   In Kết Quả
                 </button>
               </div>
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => handleSave('DRAFTING')}
                   disabled={isSaving}
                   className="px-5 py-2.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                 >
                   <Save className="h-4 w-4" />
                   Lưu nháp
                 </button>
                 <button
                   onClick={() => handleSave('COMPLETED')}
                   disabled={isSaving}
                   className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-sm"
                 >
                   <CheckCircle className="h-4 w-4" />
                   Hoàn tất & Ký
                 </button>
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
          </>
        )}
      </div>

      {/* Styles for scrollbars */}
      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: #374151; }

        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
