'use client';
import { forwardRef } from 'react';

export interface PrintContext {
  patientName: string;
  patientId: string;
  studyDate: string;
  studyDesc: string;
  reportContent: string;
  conclusion: string;
  recommendation: string;
}

interface PrintTemplateViewerProps {
  templateHtml: string;
  context: PrintContext;
}

export const PrintTemplateViewer = forwardRef<HTMLDivElement, PrintTemplateViewerProps>(
  ({ templateHtml, context }, ref) => {
    
    // Parse function using regex replacement
    const generatePrintHtml = (html: string, data: PrintContext) => {
      let parsed = html;
      parsed = parsed.replace(/{{PATIENT_NAME}}/g, data.patientName || '');
      parsed = parsed.replace(/{{PATIENT_ID}}/g, data.patientId || '');
      parsed = parsed.replace(/{{STUDY_DATE}}/g, data.studyDate || '');
      parsed = parsed.replace(/{{STUDY_DESC}}/g, data.studyDesc || '');
      parsed = parsed.replace(/{{REPORT_CONTENT}}/g, data.reportContent || '');
      parsed = parsed.replace(/{{CONCLUSION}}/g, data.conclusion || '');
      parsed = parsed.replace(/{{RECOMMENDATION}}/g, data.recommendation || '');
      return parsed;
    };

    const finalHtml = generatePrintHtml(templateHtml, context);

    return (
      <div ref={ref} className="print-container bg-white text-black p-8 sm:p-12 hidden print:block">
        <div 
          className="print-content"
          dangerouslySetInnerHTML={{ __html: finalHtml }} 
        />
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              background: white;
            }
            body > *:not(.print-container) {
              display: none !important;
            }
            .print-container {
              display: block !important;
              position: static;
              width: 100%;
              padding: 0;
            }
          }
          .print-content {
            font-family: inherit;
            line-height: 1.6;
          }
          .print-content p { margin: 0.5em 0; }
          .print-content h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5em; }
          .print-content h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5em; }
          .print-content h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5em; }
          .print-content blockquote {
            border-left: 3px solid #ccc;
            margin: 1.5em 10px;
            padding: 0.5em 10px;
          }
          .print-content hr { margin: 1.5em 0; border: 0; border-top: 1px solid #ccc; }
        `}} />
      </div>
    );
  }
);
PrintTemplateViewer.displayName = 'PrintTemplateViewer';
