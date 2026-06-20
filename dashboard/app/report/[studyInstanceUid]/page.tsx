'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, CheckCircle, Loader2, Printer } from 'lucide-react';
import TiptapEditor from './components/TiptapEditor';
import { PrintTemplateViewer, PrintContext } from './components/PrintTemplateViewer';
import { getStudyDetails, getReport, upsertReport, getDefaultTemplate } from './actions';
import { useReactToPrint } from 'react-to-print';

// Helpers
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

export default function ReportPage({ params }: { params: { studyInstanceUid: string } }) {
  const { studyInstanceUid } = params;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  // Form State
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [reportStatus, setReportStatus] = useState<string>('UNREAD');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [viewerLink, setViewerLink] = useState('');

  useEffect(() => {
    const currentHost = window.location.hostname;
    setViewerLink(`http://${currentHost}:3000/viewer?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`);
  }, [studyInstanceUid]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    }
    loadData();
  }, [studyInstanceUid]);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ket_Qua_CDHA_${studyInstanceUid}`,
  });

  const handleSave = async (status: 'DRAFTING' | 'COMPLETED') => {
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
        if (status === 'COMPLETED') {
          // Optionally redirect or show success
        }
      }
    } catch (err) {
      console.error("Failed to save report", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#020203] flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const patientName = formatPatientName(patientDetails?.PatientMainDicomTags?.PatientName);
  const patientId = patientDetails?.PatientMainDicomTags?.PatientID || "N/A";
  const studyDesc = patientDetails?.MainDicomTags?.StudyDescription || "N/A";
  const studyDate = formatDicomDateTime(patientDetails?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime);

  return (
    <div className="h-screen w-full bg-[#020203] text-zinc-300 overflow-hidden flex flex-col sm:flex-row">
      {/* 
        BÊN TRÁI (7 phần): Khu vực OHIF Viewer 
      */}
      <div className="w-full sm:w-7/12 h-[50vh] sm:h-full bg-black relative border-b sm:border-b-0 sm:border-r border-white/[0.04]">
         <iframe 
           src={viewerLink}
           title="OHIF Viewer"
           className="w-full h-full border-none"
           allowFullScreen
         />
      </div>

      {/* 
        BÊN PHẢI (5 phần): Khu vực RIS Report Form 
      */}
      <div className="w-full sm:w-5/12 h-[50vh] sm:h-full flex flex-col bg-[#0A0A0C]">
        {/* Header Thông tin bệnh nhân */}
        <div className="flex-none p-4 border-b border-white/[0.04] bg-[#070708]">
           <div className="flex items-start justify-between">
              <div>
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
                </button>
                <h2 className="text-xl font-bold text-zinc-200 tracking-wide">{patientName}</h2>
                <div className="text-xs font-mono text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                   <span>PID: <span className="text-zinc-400">{patientId}</span></span>
                   <span>Study: <span className="text-zinc-400">{studyDesc}</span></span>
                </div>
              </div>
              <div className="text-right">
                 <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                   reportStatus === 'COMPLETED' || reportStatus === 'FINAL' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950/30' : 
                   reportStatus === 'DRAFTING' || reportStatus === 'DRAFT' ? 'bg-amber-950/20 text-amber-400 border-amber-950/30' : 
                   'bg-[#020203] text-zinc-500 border-white/[0.04]'
                 }`}>
                   {reportStatus}
                 </span>
                 <div className="text-xs font-mono text-zinc-500 mt-2">{studyDate}</div>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
           
           {/* Section 1: Findings (Rich Text Editor) */}
           <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-sm font-semibold text-zinc-400 flex items-center justify-between">
                 Mô tả (Findings)
                 <span className="text-[10px] text-zinc-500 font-mono font-normal">Hỗ trợ Paste/Drop Ảnh</span>
              </label>
              <TiptapEditor 
                value={findings} 
                onChange={setFindings} 
              />
           </div>

           {/* Section 2: Conclusion */}
           <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-400">Kết luận (Conclusion)</label>
              <textarea 
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                rows={3}
                className="w-full bg-[#070708] border border-white/[0.04] rounded-xl p-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all resize-none custom-scrollbar"
                placeholder="Nhập kết luận ngắn gọn..."
              />
           </div>

           {/* Section 3: Recommendation */}
           <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-400">Đề nghị (Recommendation)</label>
              <textarea 
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={2}
                className="w-full bg-[#070708] border border-white/[0.04] rounded-xl p-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all resize-none custom-scrollbar"
                placeholder="Đề nghị các chỉ định lâm sàng tiếp theo..."
              />
           </div>

        </div>

        {/* Footer Actions */}
        <div className="flex-none p-4 border-t border-white/[0.04] bg-[#070708] flex items-center justify-between">
           <div>
             <button
               onClick={() => handlePrint()}
               className="px-4 py-2 border border-white/[0.04] text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
             >
               <Printer className="h-4 w-4" />
               In Kết Quả
             </button>
           </div>
           <div className="flex items-center gap-3">
             <button
               onClick={() => handleSave('DRAFTING')}
               disabled={isSaving}
               className="px-4 py-2 border border-white/[0.04] text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               <Save className="h-4 w-4" />
               Lưu nháp
             </button>
             <button
               onClick={() => handleSave('COMPLETED')}
               disabled={isSaving}
               className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 font-semibold text-sm rounded-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181B; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #27272A; }
      `}</style>
    </div>
  );
}
