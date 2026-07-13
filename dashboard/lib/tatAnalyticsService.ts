import { Prisma } from "@prisma/client";
import { prisma } from "@/app/db";

const startOfDay = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
const differenceInMinutes = (later: Date, earlier: Date) => Math.floor((later.getTime() - earlier.getTime()) / 60_000);

export interface TatFilters {
  dateFrom?: Date;
  dateTo?: Date;
  facilityId?: string;
  modality?: string;
}

export async function getTatAnalytics(filters: TatFilters = {}) {
  const dateFrom = filters.dateFrom || startOfDay(new Date());
  const dateTo = filters.dateTo || endOfDay(new Date());

  const where: Prisma.ImagingStudyWhereInput = {
    createdAt: { gte: dateFrom, lte: dateTo },
    ...(filters.modality && { modality: filters.modality }),
    ...(filters.facilityId && { facilityId: filters.facilityId }),
  };

  const studies = await prisma.imagingStudy.findMany({
    where,
    select: {
      id: true,
      studyInstanceUid: true,
      modality: true,
      status: true,
      scheduledAt: true,
      checkedInAt: true,
      scanStartedAt: true,
      scanEndedAt: true,
      receivedAt: true,
      firstOpenedAt: true,
      finalizedAt: true,
      deliveredAt: true,
    }
  });

  const aggregate = {
    checkinToScanAvg: 0,
    scanToReceivedAvg: 0,
    receivedToReadAvg: 0,
    readToFinalAvg: 0,
    totalCount: studies.length,
    breachCount: 0,
  };

  let checkinToScanTotal = 0, checkinToScanCount = 0;
  let scanToReceivedTotal = 0, scanToReceivedCount = 0;
  let receivedToReadTotal = 0, receivedToReadCount = 0;
  let readToFinalTotal = 0, readToFinalCount = 0;

  for (const s of studies) {
    if (s.checkedInAt && s.scanStartedAt) {
      checkinToScanTotal += Math.max(0, differenceInMinutes(s.scanStartedAt, s.checkedInAt));
      checkinToScanCount++;
    }
    if (s.scanEndedAt && s.receivedAt) {
      scanToReceivedTotal += Math.max(0, differenceInMinutes(s.receivedAt, s.scanEndedAt));
      scanToReceivedCount++;
    }
    if (s.receivedAt && s.firstOpenedAt) {
      receivedToReadTotal += Math.max(0, differenceInMinutes(s.firstOpenedAt, s.receivedAt));
      receivedToReadCount++;
    }
    if (s.firstOpenedAt && s.finalizedAt) {
      readToFinalTotal += Math.max(0, differenceInMinutes(s.finalizedAt, s.firstOpenedAt));
      readToFinalCount++;
    }
  }

  if (checkinToScanCount > 0) aggregate.checkinToScanAvg = Math.round(checkinToScanTotal / checkinToScanCount);
  if (scanToReceivedCount > 0) aggregate.scanToReceivedAvg = Math.round(scanToReceivedTotal / scanToReceivedCount);
  if (receivedToReadCount > 0) aggregate.receivedToReadAvg = Math.round(receivedToReadTotal / receivedToReadCount);
  if (readToFinalCount > 0) aggregate.readToFinalAvg = Math.round(readToFinalTotal / readToFinalCount);

  return aggregate;
}
