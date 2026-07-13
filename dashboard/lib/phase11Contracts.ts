export const SlaStage = {
  ORDER_TO_CHECKIN: 'ORDER_TO_CHECKIN',
  CHECKIN_TO_SCAN: 'CHECKIN_TO_SCAN',
  SCAN_TO_RECEIVED: 'SCAN_TO_RECEIVED',
  RECEIVED_TO_FIRST_READ: 'RECEIVED_TO_FIRST_READ',
  FIRST_READ_TO_FINAL: 'FIRST_READ_TO_FINAL',
  FINAL_TO_DELIVERED: 'FINAL_TO_DELIVERED',
  END_TO_END: 'END_TO_END'
} as const;
export type SlaStageType = typeof SlaStage[keyof typeof SlaStage];

export const AlertSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;
export type AlertSeverityType = typeof AlertSeverity[keyof typeof AlertSeverity];

export const AlertStatus = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  SUPPRESSED: 'SUPPRESSED'
} as const;
export type AlertStatusType = typeof AlertStatus[keyof typeof AlertStatus];

export const CriticalResultStatus = {
  PENDING_ACK: 'PENDING_ACK',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ESCALATED: 'ESCALATED',
  CANCELLED: 'CANCELLED'
} as const;
export type CriticalResultStatusType = typeof CriticalResultStatus[keyof typeof CriticalResultStatus];

export const QualityEventStatus = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED'
} as const;
export type QualityEventStatusType = typeof QualityEventStatus[keyof typeof QualityEventStatus];

export const PeerReviewResult = {
  AGREE: 'AGREE',
  MINOR_DISCREPANCY: 'MINOR_DISCREPANCY',
  MAJOR_DISCREPANCY: 'MAJOR_DISCREPANCY',
  CRITICAL_DISCREPANCY: 'CRITICAL_DISCREPANCY',
  TECHNICAL_LIMITATION: 'TECHNICAL_LIMITATION'
} as const;
export type PeerReviewResultType = typeof PeerReviewResult[keyof typeof PeerReviewResult];

export const PeerReviewStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type PeerReviewStatusType = typeof PeerReviewStatus[keyof typeof PeerReviewStatus];

export const QcIssueStatus = {
  OPEN: 'OPEN',
  RESCAN_REQUESTED: 'RESCAN_REQUESTED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED'
} as const;
export type QcIssueStatusType = typeof QcIssueStatus[keyof typeof QcIssueStatus];

export const DataQualityIssueStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  SUPPRESSED: 'SUPPRESSED'
} as const;
export type DataQualityIssueStatusType = typeof DataQualityIssueStatus[keyof typeof DataQualityIssueStatus];
