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
const fmtPhys = (n?: string) => n ? n.replace(/\^/g, ' ') : "—";
const fmtSex = (s?: string) => s === 'M' ? 'Nam' : s === 'F' ? 'Nữ' : s || '?';
const fmtAge = (a?: string) => a ? a.replace(/\D/g, '') : '?';
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
    if (uid) {
      const currentHost = window.location.hostname;
      const viewerUrl = `http://${currentHost}:3000/viewer/${encodeURIComponent(uid)}`;
      window.open(viewerUrl, '_blank');
    }
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
