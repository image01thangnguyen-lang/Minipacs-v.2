// interface for ViewerMeasurement
export interface ViewerMeasurement {
  measurementUID: string;
  toolName: string;
  label?: string | null;
  seriesInstanceUid?: string | null;
  sopInstanceUid?: string | null;
  frameNumber?: number | null;
  dataJson?: any;
  value?: number | null;
  unit?: string | null;
  displayText?: string | null;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export type FormattedMeasurement = {
  measurementUID: string;
  toolName: string;
  label?: string;
  seriesInstanceUid?: string;
  sopInstanceUid?: string;
  frameNumber?: number;
  summaryText: string;
  valueText?: string;
  unit?: string;
  isSafeForReport: boolean;
  unsafeReason?: string;
};

export function formatMeasurementSummary(measurement: ViewerMeasurement): FormattedMeasurement {
  let isSafeForReport = true;
  let unsafeReason = undefined;

  // 1. Missing UID or Tool Name
  if (!measurement.measurementUID || !measurement.toolName) {
    isSafeForReport = false;
    unsafeReason = 'Thieu thong tin nhan dang do dac hoac ten cong cu.';
  }

  // 2. MPR/Volume Measurements missing SOP mapping
  // If sopInstanceUid is missing, it's likely from MPR/Volume and may not map correctly to DICOM SR.
  if (!measurement.sopInstanceUid) {
    isSafeForReport = false;
    unsafeReason = 'Do dac tren MPR/Volume chua duoc ho tro map SOP an toan.';
  }

  // 3. Extract JSON data (fallback if missing DB fields)
  let data: any = {};
  try {
    data = typeof measurement.dataJson === 'string' ? JSON.parse(measurement.dataJson) : measurement.dataJson;
  } catch (e) {
    // Ignore JSON parse error, use DB fields
  }

  const toolName = measurement.toolName;
  const label = measurement.label || data?.metadata?.label || data?.label;
  const value = measurement.value ?? data?.value;
  const unit = measurement.unit ?? data?.unit;
  let displayText = measurement.displayText || data?.displayText;

  if (Array.isArray(displayText)) {
    displayText = displayText.join(', ');
  }

  let summaryParts: string[] = [];
  
  if (toolName) {
    summaryParts.push(toolName);
  }

  if (label) {
    summaryParts.push(`"${label}"`);
  }

  if (displayText) {
    summaryParts.push(`: ${displayText}`);
  } else if (value !== null && value !== undefined) {
    summaryParts.push(`: ${value} ${unit || ''}`.trim());
  } else {
    // No value/displayText
    if (!label) {
       summaryParts.push(`do dac`);
    }
  }
  
  let summaryText = summaryParts.join(' ').replace(/ \:/g, ':');
  
  // Clean up
  summaryText = `- ${summaryText}`;

  return {
    measurementUID: measurement.measurementUID,
    toolName: measurement.toolName,
    label: label || undefined,
    seriesInstanceUid: measurement.seriesInstanceUid || undefined,
    sopInstanceUid: measurement.sopInstanceUid || undefined,
    frameNumber: measurement.frameNumber || undefined,
    summaryText,
    valueText: displayText || (value !== null ? `${value} ${unit || ''}`.trim() : undefined),
    unit: unit || undefined,
    isSafeForReport,
    unsafeReason,
  };
}
