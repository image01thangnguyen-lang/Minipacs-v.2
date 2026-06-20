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
    setViewerLink(`http://${currentHost}:3000/viewer/${encodeURIComponent(studyInstanceUid)}`);
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
