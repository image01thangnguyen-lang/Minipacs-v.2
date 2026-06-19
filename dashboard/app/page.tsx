"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save, CheckCircle, Printer, Image as ImageIcon, Search, X } from "lucide-react";
import { getStudies } from './actions';
import { getStudyDetails, getReport, upsertReport, getDefaultTemplate } from './report/[studyInstanceUid]/actions';
import TiptapEditor from './report/[studyInstanceUid]/components/TiptapEditor';
import { PrintTemplateViewer } from './report/[studyInstanceUid]/components/PrintTemplateViewer';
import { useReactToPrint } from 'react-to-print';

// ── Helpers ──
const formatPatientName = (name?: string) => {
  if (!name) return "Unknown Patient";
  return name.replace(/\^/g, ' ');
};

const formatDicomDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return "N/A";
  const d = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  let t = timeStr ? timeStr.substring(0, 4).replace(/(\d{2})(\d{2})/, '$1:$2') : "";
  return t ? `${d} ${t}` : d;
};

const ModalityBadge = ({ type }: { type: string }) => {
  const m = type || "?";
  let c = "bg-zinc-900/50 text-zinc-400 border-white/[0.04]";
  if (m === 'CT') c = "bg-teal-950/30 text-teal-400 border-teal-900/50";
  else if (m === 'MR') c = "bg-blue-950/30 text-blue-400 border-blue-900/50";
  else if (['CR', 'DX'].includes(m)) c = "bg-orange-950/30 text-orange-400 border-orange-900/50";
  else if (m === 'US') c = "bg-emerald-950/30 text-emerald-400 border-emerald-900/50";
  return <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${c}`}>{m}</span>;
};

// ── Main Component ──
export default function DashboardPage() {
  // Data
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');

  // Report
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
    (async () => {
      try {
        setIsLoading(true);
        const data = await getStudies();
        setStudies(data || []);
      } catch (err) { console.error("Failed to load studies", err); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── Derived: unique modalities for filter dropdown ──
  const availableModalities = useMemo(() => {
    const set = new Set<string>();
    studies.forEach(s => { if (s.EnrichedModality) set.add(s.EnrichedModality); });
    return Array.from(set).sort();
  }, [studies]);

  // ── Derived: filtered + paginated studies ──
  const filteredStudies = useMemo(() => {
    let list = studies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => {
        const name = (s.PatientMainDicomTags?.PatientName || '').toLowerCase();
        const pid = (s.PatientMainDicomTags?.PatientID || '').toLowerCase();
        const acc = (s.MainDicomTags?.AccessionNumber || '').toLowerCase();
        return name.includes(q) || pid.includes(q) || acc.includes(q);
      });
    }
    if (modalityFilter !== 'ALL') {
      list = list.filter(s => s.EnrichedModality === modalityFilter);
    }
    return list;
  }, [studies, searchQuery, modalityFilter]);

  const totalStudies = filteredStudies.length;
  const totalPages = Math.ceil(totalStudies / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentStudies = filteredStudies.slice(startIndex, startIndex + rowsPerPage);

  // ── Handlers ──
  const handleReadReport = async (study: any) => {
    setSelectedStudy(study);
    const uid = study.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;
    try {
      setIsReportLoading(true);
      setFindings(''); setConclusion(''); setRecommendation(''); setReportStatus('UNREAD');
      const [report, studyInfo, tmpl] = await Promise.all([
        getReport(uid),
        getStudyDetails(uid),
        getDefaultTemplate()
      ]);
      if (report) { setFindings(report.findings || ''); setConclusion(report.conclusion || ''); setRecommendation(report.recommendation || ''); setReportStatus(report.status); }
      if (studyInfo) setPatientDetails(studyInfo);
      if (tmpl) setTemplateHtml(tmpl);
    } catch (err) { console.error("Failed to load report", err); }
    finally { setIsReportLoading(false); }
  };

  const handleDoubleClickRow = (study: any) => {
    const uid = study.MainDicomTags?.StudyInstanceUID;
    if (uid) window.open(`${ohifUrl}/viewer?StudyInstanceUIDs=${uid}`, '_blank');
  };

  const handleSave = async (status: 'DRAFTING' | 'COMPLETED') => {
    const uid = selectedStudy?.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;
    setIsSaving(true);
    try {
      const res = await upsertReport(uid, { status, findings, conclusion, recommendation });
      if (res.success) {
        setReportStatus(status);
        setStudies(prev => prev.map(s => s.MainDicomTags?.StudyInstanceUID === uid ? { ...s, IsStable: true } : s));
      }
    } catch (err) { console.error("Failed to save report", err); }
    finally { setIsSaving(false); }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ket_Qua_CDHA_${selectedStudy?.MainDicomTags?.StudyInstanceUID || ''}`,
  });

  // Report form variables
  const pName = formatPatientName(patientDetails?.PatientMainDicomTags?.PatientName || selectedStudy?.PatientMainDicomTags?.PatientName);
  const pId = patientDetails?.PatientMainDicomTags?.PatientID || selectedStudy?.PatientMainDicomTags?.PatientID || "N/A";
  const sDesc = patientDetails?.MainDicomTags?.StudyDescription || selectedStudy?.MainDicomTags?.StudyDescription || "N/A";
  const sDate = formatDicomDateTime(patientDetails?.MainDicomTags?.StudyDate || selectedStudy?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime || selectedStudy?.MainDicomTags?.StudyTime);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* ═══════════════════════════════════════════════ */}
      {/*  CỘT TRÁI (55%): DANH SÁCH CA CHỤP — DARK    */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="w-[55%] h-full flex flex-col bg-[#0a0e17] text-zinc-300 border-r border-zinc-800">

        {/* ── Header + Bộ lọc ── */}
        <div className="flex-none px-4 pt-3 pb-2 border-b border-white/[0.04] space-y-2">
          {/* Dòng 1: Tiêu đề + Pagination */}
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold tracking-tight text-white">Danh sách Ca chụp</h1>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-zinc-500">
                {totalStudies} ca · Trang {currentPage}/{totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded border border-white/[0.04] bg-[#070708] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"><ChevronLeft className="h-3 w-3" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalStudies === 0} className="p-1 rounded border border-white/[0.04] bg-[#070708] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"><ChevronRight className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
          {/* Dòng 2: Bộ lọc */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Tìm theo Tên, PID, Accession..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#070809] border border-white/[0.04] rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={modalityFilter}
              onChange={(e) => { setModalityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#070809] border border-white/[0.04] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer min-w-[5rem]"
            >
              <option value="ALL">Tất cả</option>
              {availableModalities.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* ── Bảng dữ liệu (Compact) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-dark">
          <table className="w-full text-left">
            <thead className="text-[9px] font-bold text-zinc-500 uppercase bg-[#070809] border-b border-white/[0.04] sticky top-0 z-10">
              <tr>
                <th className="pl-4 pr-2 py-2 tracking-wider">#</th>
                <th className="px-2 py-2 tracking-wider">Bệnh Nhân</th>
                <th className="px-2 py-2 tracking-wider w-12 text-center">Mod</th>
                <th className="px-2 py-2 tracking-wider">Mô tả ca chụp</th>
                <th className="px-2 py-2 tracking-wider">Ngày chụp</th>
                <th className="pr-4 pl-2 py-2 tracking-wider text-center">TT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500 mx-auto mb-2" /><span className="text-xs text-zinc-500">Đang tải...</span></td></tr>
              ) : currentStudies.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-xs">Không tìm thấy ca chụp nào.</td></tr>
              ) : (
                currentStudies.map((study, idx) => {
                  const nameStr = formatPatientName(study.PatientMainDicomTags?.PatientName);
                  const pidStr = study.PatientMainDicomTags?.PatientID || "N/A";
                  const desc = study.MainDicomTags?.StudyDescription || "—";
                  const isStable = study.IsStable ?? true;
                  const dt = formatDicomDateTime(study.MainDicomTags?.StudyDate, study.MainDicomTags?.StudyTime);
                  const mod = study.EnrichedModality || "?";
                  const isSelected = selectedStudy?.MainDicomTags?.StudyInstanceUID === study.MainDicomTags?.StudyInstanceUID;

                  return (
                    <tr
                      key={study.ID}
                      onClick={() => handleReadReport(study)}
                      onDoubleClick={() => handleDoubleClickRow(study)}
                      className={`cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-950/30 border-l-2 border-l-blue-500' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}
                      title="Click: đọc kết quả | Double-click: mở OHIF"
                    >
                      <td className="pl-4 pr-2 py-1.5 text-[10px] font-mono text-zinc-600">{startIndex + idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <div className="leading-tight">
                          <div className={`text-xs font-semibold truncate max-w-[160px] ${isSelected ? 'text-white' : 'text-zinc-200'}`}>{nameStr}</div>
                          <div className="text-[10px] font-mono text-zinc-600">{pidStr}</div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center"><ModalityBadge type={mod} /></td>
                      <td className="px-2 py-1.5 text-[11px] text-zinc-400 truncate max-w-[180px]" title={desc}>{desc}</td>
                      <td className="px-2 py-1.5 text-[10px] font-mono text-zinc-500 whitespace-nowrap">{dt}</td>
                      <td className="pr-4 pl-2 py-1.5 text-center">
                        {isStable
                          ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Hoàn tất"></span>
                          : <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Đang nhận"></span>
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/*  CỘT PHẢI (45%): FORM BÁO CÁO — LIGHT       */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="w-[45%] h-full flex flex-col bg-[#f4f6f9] text-slate-900 relative">

        {!selectedStudy ? (
          /* ── Trạng thái rỗng ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-5 bg-slate-200/80 rounded-2xl flex items-center justify-center"><ImageIcon className="h-8 w-8 text-slate-400" /></div>
            <h3 className="text-lg font-semibold text-slate-600 mb-1.5">Chưa chọn ca chụp</h3>
            <p className="max-w-[260px] text-xs text-slate-400 leading-relaxed">Click vào một ca chụp từ danh sách bên trái để viết kết quả. Double-click để mở OHIF Viewer trên tab mới.</p>
          </div>
        ) : isReportLoading ? (
          /* ── Loading ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f4f6f9] z-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mb-3" />
            <span className="text-xs text-slate-500">Đang tải thông tin bệnh án...</span>
          </div>
        ) : (
          /* ── Form nhập kết quả ── */
          <>
            {/* Header: Thông tin hành chính — Grid 3 cột */}
            <div className="flex-none px-5 py-3 border-b border-slate-200 bg-white shadow-sm z-10">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">{pName}</h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${
                  reportStatus === 'COMPLETED' || reportStatus === 'FINAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  reportStatus === 'DRAFTING' || reportStatus === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-500 border-slate-200'
                }`}>{reportStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[11px]">
                <div><span className="text-slate-400">Mã BN:</span> <span className="font-semibold text-slate-700">{pId}</span></div>
                <div><span className="text-slate-400">Ngày chụp:</span> <span className="font-semibold text-slate-700">{sDate}</span></div>
                <div><span className="text-slate-400">Chỉ định:</span> <span className="font-semibold text-slate-700">{sDesc}</span></div>
              </div>
            </div>

            {/* Nội dung báo cáo */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar-light">

              {/* Mô tả (Findings) — Giấy A4 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Mô tả (Findings)</label>
                  <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">Paste/Drop ảnh</span>
                </div>
                <div className="bg-white border border-slate-200 text-black shadow-md rounded-xl p-6 min-h-[400px] transition-shadow hover:shadow-lg">
                  <TiptapEditor value={findings} onChange={setFindings} />
                </div>
              </div>

              {/* Kết luận */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Kết luận (Conclusion)</label>
                <textarea
                  value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={3}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-sm"
                  placeholder="Nhập kết luận ngắn gọn..."
                />
              </div>

              {/* Đề nghị */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Đề nghị (Recommendation)</label>
                <textarea
                  value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-sm"
                  placeholder="Đề nghị chỉ định lâm sàng tiếp theo..."
                />
              </div>
            </div>

            {/* Footer: Các nút hành động — 1 dòng */}
            <div className="flex-none px-5 py-3 border-t border-slate-200 bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.03)] z-10 flex items-center justify-between">
              <button onClick={() => handlePrint()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                <Printer className="h-3.5 w-3.5" /> In Kết Quả
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSave('DRAFTING')} disabled={isSaving} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm">
                  <Save className="h-3.5 w-3.5" /> Lưu nháp
                </button>
                <button onClick={() => handleSave('COMPLETED')} disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" /> Hoàn tất & Ký
                </button>
              </div>
            </div>

            {/* Hidden Print Template */}
            <div className="hidden">
              <PrintTemplateViewer ref={printRef} templateHtml={templateHtml} context={{ patientName: pName, patientId: pId, studyDate: sDate, studyDesc: sDesc, reportContent: findings, conclusion, recommendation }} />
            </div>
          </>
        )}
      </div>

      {/* ── Global Styles ── */}
      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: #334155; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
