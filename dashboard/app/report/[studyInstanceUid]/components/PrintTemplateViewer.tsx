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
  doctorName?: string;
  doctorTitle?: string;
  doctorSpecialty?: string;
  doctorLicenseNumber?: string;
  doctorSignatureImagePath?: string;
  clinicName?: string;
  clinicLegalName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicWebsite?: string;
  clinicLogoPath?: string;
  clinicHeaderText?: string;
  clinicFooterText?: string;
  clinicLicenseNumber?: string;
}

interface PrintTemplateViewerProps {
  templateHtml: string;
  context: PrintContext;
}

export const PrintTemplateViewer = forwardRef<HTMLDivElement, PrintTemplateViewerProps>(
  ({ templateHtml, context }, ref) => {
    const escapeHtml = (value?: string) =>
      (value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const buildDoctorSignatureBlock = (data: PrintContext) => {
      if (!data.doctorName && !data.doctorSignatureImagePath) return "";

      const title = [data.doctorTitle, data.doctorSpecialty].filter(Boolean).join(" - ");
      const signatureImage = data.doctorSignatureImagePath
        ? `<img src="${escapeHtml(data.doctorSignatureImagePath)}" alt="Chu ky bac si" class="doctor-signature-image" />`
        : "";

      return `
        <div class="doctor-signature-block">
          <div class="doctor-signature-title">Bác sĩ đọc kết quả</div>
          ${signatureImage}
          <div class="doctor-signature-name">${escapeHtml(data.doctorName)}</div>
          ${title ? `<div class="doctor-signature-meta">${escapeHtml(title)}</div>` : ""}
          ${data.doctorLicenseNumber ? `<div class="doctor-signature-meta">Số CCHN: ${escapeHtml(data.doctorLicenseNumber)}</div>` : ""}
        </div>
      `;
    };

    const buildClinicHeaderBlock = (data: PrintContext) => {
      const clinicName = data.clinicName || data.clinicLegalName;
      if (!clinicName && !data.clinicLogoPath && !data.clinicHeaderText) return "";

      const logo = data.clinicLogoPath
        ? `<img src="${escapeHtml(data.clinicLogoPath)}" alt="Logo phong kham" class="clinic-logo" />`
        : `<div class="clinic-logo-placeholder"></div>`;
      const contactLine = [data.clinicPhone, data.clinicEmail, data.clinicWebsite].filter(Boolean).join(" · ");

      return `
        <div class="clinic-header">
          <div class="clinic-logo-box">${logo}</div>
          <div class="clinic-header-text">
            <div class="clinic-name">${escapeHtml(clinicName)}</div>
            ${data.clinicLegalName && data.clinicLegalName !== clinicName ? `<div class="clinic-legal-name">${escapeHtml(data.clinicLegalName)}</div>` : ""}
            ${data.clinicHeaderText ? `<div class="clinic-subtitle">${escapeHtml(data.clinicHeaderText)}</div>` : ""}
            ${data.clinicAddress ? `<div class="clinic-meta">${escapeHtml(data.clinicAddress)}</div>` : ""}
            ${contactLine ? `<div class="clinic-meta">${escapeHtml(contactLine)}</div>` : ""}
            ${data.clinicLicenseNumber ? `<div class="clinic-meta">Giay phep: ${escapeHtml(data.clinicLicenseNumber)}</div>` : ""}
          </div>
        </div>
      `;
    };

    const buildClinicFooterBlock = (data: PrintContext) => {
      if (!data.clinicFooterText) return "";
      return `<div class="clinic-footer">${escapeHtml(data.clinicFooterText)}</div>`;
    };
    
    // Parse function using regex replacement
    const generatePrintHtml = (html: string, data: PrintContext) => {
      let parsed = html;
      const clinicHeader = buildClinicHeaderBlock(data);
      const clinicFooter = buildClinicFooterBlock(data);

      const hasClinicHeaderPlaceholder = parsed.includes("{{CLINIC_HEADER}}");
      const hasClinicFooterPlaceholder = parsed.includes("{{CLINIC_FOOTER}}");

      parsed = parsed.replace(/{{PATIENT_NAME}}/g, data.patientName || '');
      parsed = parsed.replace(/{{PATIENT_ID}}/g, data.patientId || '');
      parsed = parsed.replace(/{{STUDY_DATE}}/g, data.studyDate || '');
      parsed = parsed.replace(/{{STUDY_DESC}}/g, data.studyDesc || '');
      parsed = parsed.replace(/{{REPORT_CONTENT}}/g, data.reportContent || '');
      parsed = parsed.replace(/{{CONCLUSION}}/g, data.conclusion || '');
      parsed = parsed.replace(/{{RECOMMENDATION}}/g, data.recommendation || '');
      parsed = parsed.replace(/{{DOCTOR_NAME}}/g, escapeHtml(data.doctorName));
      parsed = parsed.replace(/{{DOCTOR_TITLE}}/g, escapeHtml(data.doctorTitle));
      parsed = parsed.replace(/{{DOCTOR_SPECIALTY}}/g, escapeHtml(data.doctorSpecialty));
      parsed = parsed.replace(/{{DOCTOR_LICENSE}}/g, escapeHtml(data.doctorLicenseNumber));
      parsed = parsed.replace(/{{CLINIC_HEADER}}/g, clinicHeader);
      parsed = parsed.replace(/{{CLINIC_FOOTER}}/g, clinicFooter);
      parsed = parsed.replace(/{{CLINIC_NAME}}/g, escapeHtml(data.clinicName));
      parsed = parsed.replace(/{{CLINIC_LEGAL_NAME}}/g, escapeHtml(data.clinicLegalName));
      parsed = parsed.replace(/{{CLINIC_ADDRESS}}/g, escapeHtml(data.clinicAddress));
      parsed = parsed.replace(/{{CLINIC_PHONE}}/g, escapeHtml(data.clinicPhone));
      parsed = parsed.replace(/{{CLINIC_EMAIL}}/g, escapeHtml(data.clinicEmail));
      parsed = parsed.replace(/{{CLINIC_WEBSITE}}/g, escapeHtml(data.clinicWebsite));
      parsed = parsed.replace(/{{CLINIC_HEADER_TEXT}}/g, escapeHtml(data.clinicHeaderText));
      parsed = parsed.replace(/{{CLINIC_FOOTER_TEXT}}/g, escapeHtml(data.clinicFooterText));
      parsed = parsed.replace(/{{CLINIC_LICENSE}}/g, escapeHtml(data.clinicLicenseNumber));
      parsed = parsed.replace(
        /{{CLINIC_LOGO}}/g,
        data.clinicLogoPath
          ? `<img src="${escapeHtml(data.clinicLogoPath)}" alt="Logo phong kham" class="clinic-logo" />`
          : ''
      );
      parsed = parsed.replace(
        /{{DOCTOR_SIGNATURE}}/g,
        data.doctorSignatureImagePath
          ? `<img src="${escapeHtml(data.doctorSignatureImagePath)}" alt="Chu ky bac si" class="doctor-signature-image" />`
          : ''
      );
      return `${hasClinicHeaderPlaceholder ? "" : clinicHeader}${parsed}${buildDoctorSignatureBlock(data)}${hasClinicFooterPlaceholder ? "" : clinicFooter}`;
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
          .clinic-header {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            border-bottom: 1px solid #d5dbe1;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .clinic-logo-box {
            width: 112px;
            min-height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .clinic-logo {
            display: block;
            max-width: 112px;
            max-height: 64px;
            object-fit: contain;
          }
          .clinic-logo-placeholder {
            width: 72px;
            height: 48px;
            border: 1px solid #d5dbe1;
            background: #f6f8fa;
          }
          .clinic-header-text {
            flex: 1;
            min-width: 0;
          }
          .clinic-name {
            font-size: 1.15rem;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1.25;
          }
          .clinic-legal-name {
            font-weight: 700;
            color: #333;
          }
          .clinic-subtitle,
          .clinic-meta {
            font-size: 0.875rem;
            color: #444;
          }
          .clinic-footer {
            margin-top: 28px;
            border-top: 1px solid #d5dbe1;
            padding-top: 10px;
            font-size: 0.8rem;
            color: #555;
            white-space: pre-line;
          }
          .print-content p { margin: 0.5em 0; }
          .print-content h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5em; }
          .print-content h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5em; }
          .print-content h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5em; }
          .doctor-signature-block {
            margin-top: 36px;
            margin-left: auto;
            width: 240px;
            text-align: center;
            page-break-inside: avoid;
          }
          .doctor-signature-title {
            font-weight: 700;
            margin-bottom: 8px;
          }
          .doctor-signature-image {
            display: block;
            max-width: 180px;
            max-height: 80px;
            object-fit: contain;
            margin: 0 auto 4px;
          }
          .doctor-signature-name {
            font-weight: 700;
            text-transform: uppercase;
          }
          .doctor-signature-meta {
            font-size: 0.875rem;
            color: #333;
          }
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
