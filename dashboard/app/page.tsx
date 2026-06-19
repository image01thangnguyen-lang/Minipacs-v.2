"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, Save, CheckCircle, Printer, Image as ImageIcon, Search, X, Clock } from "lucide-react";
import { getStudies } from './actions';
import { getStudyDetails, getReport, upsertReport, getDefaultTemplate } from './report/[studyInstanceUid]/actions';
import TiptapEditor from './report/[studyInstanceUid]/components/TiptapEditor';
import { PrintTemplateViewer } from './report/[studyInstanceUid]/components/PrintTemplateViewer';
import { useReactToPrint } from 'react-to-print';

// ── Helpers ──
const fmtName = (n?: string) => n ? n.replace(/\^/g, ' ') : "Unknown Patient";
const fmtDt = (d?: string, t?: string) => {
  if (!d) return "—";
  const ds = d.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  const ts = t ? t.substring(0, 4).replace(/(\d{2})(\d{2})/, '$1:$2') : "";
  return ts ? `${ds} ${ts}` : ds;
};

const ModBadge = ({ m }: { m: string }) => {
  const v = m || "?";
  let c = "bg-zinc-900/60 text-zinc-500 border-zinc-800/50";
  if (v === 'CT') c = "bg-teal-950/40 text-teal-400 border-teal-900/50";
  else if (v === 'MR') c = "bg-blue-950/40 text-blue-400 border-blue-900/50";
  else if (['CR','DX'].includes(v)) c = "bg-orange-950/40 text-orange-400 border-orange-900/50";
  else if (v === 'US') c = "bg-emerald-950/40 text-emerald-400 border-emerald-900/50";
  return <span className={`px-1.5 py-px rounded font-mono text-[10px] font-bold border ${c}`}>{v}</span>;
};

// ── Main ──
export default function DashboardPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');

  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [reportStatus, setReportStatus] = useState('UNREAD');
  const [templateHtml, setTemplateHtml] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ohifUrl = process.env.NEXT_PUBLIC_OHIF_URL || 'http://localhost:3000';

  useEffect(() => {
    (async () => {
      try { setIsLoading(true); const d = await getStudies(); setStudies(d || []); }
      catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  useEffect(() => {
    document.title = "Mini PACS - Danh sách ca chụp";
  }, []);

  // ── Derived data ──
  const modalities = useMemo(() => {
    const s = new Set<string>(); studies.forEach(x => { if (x.EnrichedModality) s.add(x.EnrichedModality); }); return Array.from(s).sort();
  }, [studies]);

  const filtered = useMemo(() => {
    let l = studies;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); l = l.filter(s => ((s.PatientMainDicomTags?.PatientName||'')+(s.PatientMainDicomTags?.PatientID||'')+(s.MainDicomTags?.AccessionNumber||'')).toLowerCase().includes(q)); }
    if (modalityFilter !== 'ALL') l = l.filter(s => s.EnrichedModality === modalityFilter);
    return l;
  }, [studies, searchQuery, modalityFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const pageStudies = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Patient history: all studies sharing same PatientID ──
  const patientHistory = useMemo(() => {
    if (!selectedStudy) return [];
    const pid = selectedStudy.PatientMainDicomTags?.PatientID;
    if (!pid) return [];
    return studies.filter(s => s.PatientMainDicomTags?.PatientID === pid);
  }, [studies, selectedStudy]);

  // ── Handlers ──
  const handleSelect = async (study: any) => {
    setSelectedStudy(study);
    const uid = study.MainDicomTags?.StudyInstanceUID;
    if (!uid) return;
    try {
      setIsReportLoading(true);
      setFindings(''); setConclusion(''); setRecommendation(''); setReportStatus('UNREAD');
      const [rpt, info, tmpl] = await Promise.all([getReport(uid), getStudyDetails(uid), getDefaultTemplate()]);
      if (rpt) { setFindings(rpt.findings||''); setConclusion(rpt.conclusion||''); setRecommendation(rpt.recommendation||''); setReportStatus(rpt.status); }
      if (info) setPatientDetails(info);
      if (tmpl) setTemplateHtml(tmpl);
    } catch (e) { console.error(e); }
    finally { setIsReportLoading(false); }
  };

  const openViewer = (study: any) => {
    const uid = study.MainDicomTags?.StudyInstanceUID;
    const patientName = fmtName(study.PatientMainDicomTags?.PatientName);
    if (uid) window.open(`${ohifUrl}/viewer?StudyInstanceUIDs=${uid}&patientName=${encodeURIComponent(patientName)}`, '_blank');
  };

  const handleSave = async (status: 'DRAFTING' | 'COMPLETED') => {
    const uid = selectedStudy?.MainDicomTags?.StudyInstanceUID; if (!uid) return;
    setIsSaving(true);
    try {
      const r = await upsertReport(uid, { status, findings, conclusion, recommendation });
      if (r.success) { setReportStatus(status); setStudies(p => p.map(s => s.MainDicomTags?.StudyInstanceUID === uid ? { ...s, IsStable: true } : s)); }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `CDHA_${selectedStudy?.MainDicomTags?.StudyInstanceUID||''}` });

  const pN = fmtName(patientDetails?.PatientMainDicomTags?.PatientName || selectedStudy?.PatientMainDicomTags?.PatientName);
  const pI = patientDetails?.PatientMainDicomTags?.PatientID || selectedStudy?.PatientMainDicomTags?.PatientID || "—";
  const sD = patientDetails?.MainDicomTags?.StudyDescription || selectedStudy?.MainDicomTags?.StudyDescription || "—";
  const sDt = fmtDt(patientDetails?.MainDicomTags?.StudyDate || selectedStudy?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime || selectedStudy?.MainDicomTags?.StudyTime);
  const selUid = selectedStudy?.MainDicomTags?.StudyInstanceUID;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-[#080b14]">

      {/* ═══ CỘT TRÁI 55% ═══ */}
      <div className="w-[55%] h-full flex flex-col bg-[#0a0e17] text-zinc-300 border-r border-zinc-800/60">

        {/* ── PHẦN TRÊN (70%): Bảng chính ── */}
        <div className="h-[70%] flex flex-col border-b border-zinc-800/60">

          {/* Header + Bộ lọc */}
          <div className="flex-none px-2 pt-2 pb-1.5 space-y-1.5 border-b border-white/[0.03]">
            <div className="flex items-center justify-between">
              <h1 className="text-[13px] font-bold text-white tracking-tight">Danh sách Ca chụp</h1>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-600">{filtered.length} ca · {currentPage}/{totalPages}</span>
                <div className="flex gap-0.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="p-0.5 rounded border border-white/[0.04] bg-[#070809] text-zinc-500 hover:text-zinc-300 disabled:opacity-20"><ChevronLeft className="h-3 w-3"/></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage>=totalPages} className="p-0.5 rounded border border-white/[0.04] bg-[#070809] text-zinc-500 hover:text-zinc-300 disabled:opacity-20"><ChevronRight className="h-3 w-3"/></button>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600"/>
                <input type="text" placeholder="Tìm Tên, PID, Accession..." value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setCurrentPage(1);}}
                  className="w-full pl-7 pr-7 py-1 text-[11px] bg-[#070809] border border-white/[0.04] rounded text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-700"/>
                {searchQuery && <button onClick={()=>{setSearchQuery('');setCurrentPage(1);}} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"><X className="h-3 w-3"/></button>}
              </div>
              <select value={modalityFilter} onChange={e=>{setModalityFilter(e.target.value);setCurrentPage(1);}}
                className="bg-[#070809] border border-white/[0.04] text-zinc-400 text-[11px] rounded px-1.5 py-1 focus:outline-none cursor-pointer min-w-[4rem]">
                <option value="ALL">Tất cả</option>
                {modalities.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Bảng chính */}
          <div className="flex-1 overflow-y-auto scr-dark">
            <table className="w-full text-left">
              <thead className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#070809] border-b border-white/[0.03] sticky top-0 z-10">
                <tr>
                  <th className="pl-2 pr-1 py-1 w-6">#</th>
                  <th className="px-1 py-1">Bệnh Nhân</th>
                  <th className="px-1 py-1 w-10 text-center">Mod</th>
                  <th className="px-1 py-1">Mô tả</th>
                  <th className="px-1 py-1">Ngày</th>
                  <th className="pr-2 pl-1 py-1 w-6 text-center">TT</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="h-4 w-4 animate-spin text-zinc-600 mx-auto"/></td></tr>
                ) : pageStudies.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-zinc-700 text-[11px]">Không có ca chụp nào.</td></tr>
                ) : pageStudies.map((s, i) => {
                  const isSel = selUid === s.MainDicomTags?.StudyInstanceUID;
                  return (
                    <tr key={s.ID} onClick={()=>handleSelect(s)} onDoubleClick={()=>openViewer(s)}
                      className={`cursor-pointer select-none transition-colors ${isSel ? 'bg-blue-950/40 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent hover:bg-white/[0.015] even:bg-[#0e1322]/30'}`}
                      title="Click: đọc KQ · Dbl-click: OHIF">
                      <td className="pl-2 pr-1 py-1 text-[10px] font-mono text-zinc-700">{(currentPage-1)*rowsPerPage+i+1}</td>
                      <td className="px-1 py-1">
                        <div className={`text-[11px] font-bold truncate max-w-[140px] ${isSel?'text-white':'text-zinc-100'}`}>{fmtName(s.PatientMainDicomTags?.PatientName)}</div>
                        <div className="text-[9px] font-mono text-zinc-400">{s.PatientMainDicomTags?.PatientID||'—'}</div>
                      </td>
                      <td className="px-1 py-1 text-center"><ModBadge m={s.EnrichedModality||'?'}/></td>
                      <td className="px-1 py-1 text-[10px] text-zinc-300 truncate max-w-[140px]">{s.MainDicomTags?.StudyDescription||'—'}</td>
                      <td className="px-1 py-1 text-[10px] font-mono text-zinc-300 whitespace-nowrap">{fmtDt(s.MainDicomTags?.StudyDate,s.MainDicomTags?.StudyTime)}</td>
                      <td className="pr-2 pl-1 py-1 text-center">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${(s.IsStable??true)?'bg-emerald-500':'bg-amber-500 animate-pulse'}`}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PHẦN DƯỚI (30%): Lịch sử bệnh nhân ── */}
        <div className="h-[30%] flex flex-col bg-[#090d16]">
          <div className="flex-none px-2 py-1.5 border-b border-white/[0.03] flex items-center gap-2">
            <Clock className="h-3 w-3 text-zinc-600"/>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Lịch sử chụp</span>
            {selectedStudy && <span className="text-[10px] text-zinc-600 font-mono">· PID: {selectedStudy.PatientMainDicomTags?.PatientID||'—'} · {patientHistory.length} ca</span>}
          </div>
          <div className="flex-1 overflow-y-auto scr-dark">
            {!selectedStudy ? (
              <div className="h-full flex items-center justify-center text-[11px] text-zinc-700">Chọn một bệnh nhân để xem lịch sử chụp</div>
            ) : patientHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-zinc-700">Không có lịch sử</div>
            ) : (
              <table className="w-full text-left">
                <thead className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider bg-[#070809] border-b border-white/[0.03] sticky top-0 z-10">
                  <tr>
                    <th className="pl-2 pr-1 py-1">Ngày chụp</th>
                    <th className="px-1 py-1 w-10 text-center">Mod</th>
                    <th className="px-1 py-1">Mô tả ca chụp</th>
                    <th className="pr-2 pl-1 py-1 w-6 text-center">TT</th>
                  </tr>
                </thead>
                <tbody>
                  {patientHistory.map(h => {
                    const hUid = h.MainDicomTags?.StudyInstanceUID;
                    const isCurrent = hUid === selUid;
                    return (
                      <tr key={h.ID}
                        onClick={()=>handleSelect(h)} onDoubleClick={()=>openViewer(h)}
                        className={`cursor-pointer select-none transition-colors ${isCurrent ? 'bg-blue-950/30 text-blue-300' : 'hover:bg-white/[0.015] even:bg-[#0e1322]/20 text-zinc-300'}`}
                        title="Click: chọn · Dbl-click: OHIF">
                        <td className="pl-2 pr-1 py-1 text-[10px] font-mono whitespace-nowrap">{fmtDt(h.MainDicomTags?.StudyDate, h.MainDicomTags?.StudyTime)}</td>
                        <td className="px-1 py-1 text-center"><ModBadge m={h.EnrichedModality||'?'}/></td>
                        <td className="px-1 py-1 text-[10px] truncate max-w-[200px]">{h.MainDicomTags?.StudyDescription||'—'}</td>
                        <td className="pr-2 pl-1 py-1 text-center"><span className={`inline-block w-1.5 h-1.5 rounded-full ${(h.IsStable??true)?'bg-emerald-500':'bg-amber-500 animate-pulse'}`}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CỘT PHẢI 45%: REPORT FORM — FULL DARK ═══ */}
      <div className="w-[45%] h-full flex flex-col bg-[#0c101d] text-zinc-300 relative">

        {!selectedStudy ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 mb-4 bg-zinc-900/60 rounded-2xl flex items-center justify-center border border-zinc-800/40"><ImageIcon className="h-7 w-7 text-zinc-600"/></div>
            <h3 className="text-sm font-semibold text-zinc-500 mb-1">Chưa chọn ca chụp</h3>
            <p className="max-w-[240px] text-[11px] text-zinc-700 leading-relaxed">Click vào ca chụp bên trái để viết kết quả.<br/>Double-click để mở OHIF Viewer.</p>
          </div>
        ) : isReportLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c101d] z-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600 mb-2"/><span className="text-[11px] text-zinc-600">Đang tải...</span>
          </div>
        ) : (
          <>
            {/* Header thông tin hành chính */}
            <div className="flex-none px-3 py-2 border-b border-zinc-800/40 bg-[#0e1322]">
              <div className="flex items-start justify-between mb-1.5">
                <h2 className="text-[13px] font-bold text-zinc-100 uppercase tracking-wide">{pN}</h2>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${
                  reportStatus==='COMPLETED'||reportStatus==='FINAL' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' :
                  reportStatus==='DRAFTING'||reportStatus==='DRAFT' ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' :
                  'bg-zinc-900/50 text-zinc-500 border-zinc-800/40'
                }`}>{reportStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 text-[10px]">
                <div><span className="text-zinc-400">Mã BN:</span> <span className="text-zinc-200 font-semibold">{pI}</span></div>
                <div><span className="text-zinc-400">Ngày:</span> <span className="text-zinc-200 font-semibold">{sDt}</span></div>
                <div><span className="text-zinc-400">Chỉ định:</span> <span className="text-zinc-200 font-semibold">{sD}</span></div>
              </div>
            </div>

            {/* Nội dung form */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scr-dark">

              {/* Mô tả (Findings) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-zinc-300">Mô tả (Findings)</label>
                  <span className="text-[9px] text-zinc-700 font-mono bg-zinc-900/50 px-1.5 py-0.5 rounded">Paste/Drop ảnh</span>
                </div>
                <div className="bg-[#131929] text-zinc-100 border border-zinc-800/60 shadow-inner rounded-xl p-4 min-h-[350px]">
                  <TiptapEditor value={findings} onChange={setFindings}/>
                </div>
              </div>

              {/* Kết luận */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Kết luận (Conclusion)</label>
                <textarea value={conclusion} onChange={e=>setConclusion(e.target.value)} rows={3}
                  className="w-full bg-[#131929] border border-zinc-800/60 rounded-lg p-2.5 text-[12px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all resize-none scr-dark"/>
              </div>

              {/* Đề nghị */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-300">Đề nghị (Recommendation)</label>
                <textarea value={recommendation} onChange={e=>setRecommendation(e.target.value)} rows={2}
                  className="w-full bg-[#131929] border border-zinc-800/60 rounded-lg p-2.5 text-[12px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all resize-none scr-dark"/>
              </div>
            </div>

            {/* Footer nút bấm */}
            <div className="flex-none px-3 py-2 border-t border-zinc-800/40 bg-[#0e1322] flex items-center justify-between">
              <button onClick={()=>handlePrint()} className="px-3 py-1.5 bg-blue-950/40 text-blue-400 border border-blue-900/60 hover:bg-blue-900/40 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1.5">
                <Printer className="h-3 w-3"/> In Kết Quả
              </button>
              <div className="flex items-center gap-2">
                <button onClick={()=>handleSave('DRAFTING')} disabled={isSaving} className="px-3 py-1.5 bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40">
                  <Save className="h-3 w-3"/> Lưu nháp
                </button>
                <button onClick={()=>handleSave('COMPLETED')} disabled={isSaving} className="px-3 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 hover:bg-emerald-900/40 font-semibold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40">
                  <CheckCircle className="h-3 w-3"/> Hoàn tất & Ký
                </button>
              </div>
            </div>

            <div className="hidden">
              <PrintTemplateViewer ref={printRef} templateHtml={templateHtml} context={{ patientName:pN, patientId:pI, studyDate:sDt, studyDesc:sD, reportContent:findings, conclusion, recommendation }}/>
            </div>
          </>
        )}
      </div>

      <style>{`
        .scr-dark::-webkit-scrollbar{width:4px}
        .scr-dark::-webkit-scrollbar-track{background:transparent}
        .scr-dark::-webkit-scrollbar-thumb{background:#1e293b;border-radius:10px}
        .scr-dark::-webkit-scrollbar-thumb:hover{background:#334155}
      `}</style>
    </div>
  );
}
