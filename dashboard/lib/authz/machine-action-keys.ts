/**
 * Shared constants for the Permission Matrix.
 * This file MUST stay free of server-only imports (prisma, fs, etc.)
 * so it can be safely imported in "use client" components.
 */

export const MACHINE_ACTION_KEYS = [
  "READ_STUDY",
  "EDIT_CLINICAL",
  "ASSIGN_CASE",
  "DRAFT_REPORT",
  "SIGN_REPORT",
  "APPROVE_REPORT",
  "UNFINALIZE_REPORT",
  "CANCEL_DRAFT",
  "DELIVER_RESULT",
  "SYNC_HIS",
] as const;

export type MachineActionKey = typeof MACHINE_ACTION_KEYS[number];
