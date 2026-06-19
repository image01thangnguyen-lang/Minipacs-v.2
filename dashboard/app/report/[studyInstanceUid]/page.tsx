'use client';

import { useEffect, useState, use, useRef } from 'react';
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

export default function ReportPage({ params }: { params: Promise<{ studyInstanceUid: string }> }) {
  const { studyInstanceUid } = use(params);
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

  const ohifUrl = process.env.NEXT_PUBLIC_OHIF_URL || 'http://localhost:3000';
  const viewerLink = `${ohifUrl}/viewer?StudyInstanceUIDs=${studyInstanceUid}`;

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
      <div className="h-screen w-full bg-[#0a0a0c] flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const patientName = formatPatientName(patientDetails?.PatientMainDicomTags?.PatientName);
  const patientId = patientDetails?.PatientMainDicomTags?.PatientID || "N/A";
  const studyDesc = patientDetails?.MainDicomTags?.StudyDescription || "N/A";
  const studyDate = formatDicomDateTime(patientDetails?.MainDicomTags?.StudyDate, patientDetails?.MainDicomTags?.StudyTime);

  return (
    <div className="h-screen w-full bg-[#0a0a0c] text-slate-200 overflow-hidden flex flex-col sm:flex-row">
      {/* 
        BÊN TRÁI (7 phần): Khu vực OHIF Viewer 
      */}
      <div className="w-full sm:w-7/12 h-[50vh] sm:h-full bg-black relative border-b sm:border-b-0 sm:border-r border-slate-800">
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
      <div className="w-full sm:w-5/12 h-[50vh] sm:h-full flex flex-col bg-[#0d0d0f]">
        {/* Header Thông tin bệnh nhân */}
        <div className="flex-none p-4 border-b border-slate-800 bg-slate-900/40">
           <div className="flex items-start justify-between">
              <div>
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Quay lại danh sách
                </button>
                <h2 className="text-xl font-bold text-white tracking-wide">{patientName}</h2>
                <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                   <span>PID: <span className="text-slate-300">{patientId}</span></span>
                   <span>Study: <span className="text-slate-300">{studyDesc}</span></span>
                </div>
              </div>
              <div className="text-right">
                 <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${
                   reportStatus === 'COMPLETED' || reportStatus === 'FINAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                   reportStatus === 'DRAFTING' || reportStatus === 'DRAFT' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                   'bg-slate-800 text-slate-400 border-slate-700'
                 }`}>
                   {reportStatus}
                 </span>
                 <div className="text-xs font-mono text-slate-500 mt-2">{studyDate}</div>
              </div>
           </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
           
           {/* Section 1: Findings (Rich Text Editor) */}
           <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                 Mô tả (Findings)
                 <span className="text-[10px] text-slate-500 font-mono font-normal">Hỗ trợ Paste/Drop Ảnh</span>
              </label>
              <TiptapEditor 
                value={findings} 
                onChange={setFindings} 
              />
           </div>

           {/* Section 2: Conclusion */}
           <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Kết luận (Conclusion)</label>
              <textarea 
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none custom-scrollbar"
                placeholder="Nhập kết luận ngắn gọn..."
              />
           </div>

           {/* Section 3: Recommendation */}
           <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Đề nghị (Recommendation)</label>
              <textarea 
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none custom-scrollbar"
                placeholder="Đề nghị các chỉ định lâm sàng tiếp theo..."
              />
           </div>

        </div>

        {/* Footer Actions */}
        <div className="flex-none p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
           <div>
             <button
               onClick={() => handlePrint()}
               className="px-4 py-2 border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
             >
               <Printer className="h-4 w-4" />
               In Kết Quả
             </button>
           </div>
           <div className="flex items-center gap-3">
             <button
               onClick={() => handleSave('DRAFTING')}
               disabled={isSaving}
               className="px-4 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
             >
               <Save className="h-4 w-4" />
               Lưu nháp
             </button>
             <button
               onClick={() => handleSave('COMPLETED')}
               disabled={isSaving}
               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
