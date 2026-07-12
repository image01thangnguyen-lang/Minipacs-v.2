"use server";

import { z } from "zod";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth"; // Assuming auth setup exists
import {
  getCommandCenterSummary,
  getLiveQueue,
  getDoctorMachineBacklog,
  getActiveAlerts,
  getSlaBreaches,
  getStuckWorkflow,
  CommandCenterFilters,
  PaginationParams
} from "@/lib/commandCenterService";

// Validation Schemas
const filterSchema = z.object({
  dateFrom: z.string().optional().transform(val => {
    if (!val) return undefined;
    const date = new Date(`${val}T00:00:00.000+07:00`);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  dateTo: z.string().optional().transform(val => {
    if (!val) return undefined;
    const date = new Date(`${val}T23:59:59.999+07:00`);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  facilityId: z.string().optional(),
  modality: z.string().optional(),
  machineId: z.string().optional(),
  doctorId: z.string().optional(),
  priority: z.string().optional()
}).refine(data => {
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo;
  }
  return true;
}, {
  message: "Từ ngày phải nhỏ hơn hoặc bằng Đến ngày",
  path: ["dateFrom"]
});

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50)
});

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check role or specific permissions. Using mock role for now if session doesn't have it.
  const user = {
    id: session.user.id || "unknown",
    role: (session.user as any).role || "USER",
    permissions: (session.user as any).permissions || []
  };

  return user;
}

function enforceCommandCenterRead(user: any) {
  if (user.role !== "ADMIN" && !user.permissions?.includes("commandCenter.read")) {
    throw new Error("Forbidden: Missing commandCenter.read permission");
  }
}

export async function fetchCommandCenterSummary(filters: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);

  const validFilters = filterSchema.parse(filters);
  return getCommandCenterSummary(user, validFilters);
}

export async function fetchLiveQueue(filters: any, pagination: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);
  const validFilters = filterSchema.parse(filters);
  const parsed = paginationSchema.parse(pagination);
  const validPagination = {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 50,
  };

  return getLiveQueue(user, validFilters, validPagination);
}

export async function fetchDoctorMachineBacklog(filters: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);
  const validFilters = filterSchema.parse(filters);

  return getDoctorMachineBacklog(user, validFilters);
}

export async function fetchActiveAlerts(filters: any, pagination: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);
  const validFilters = filterSchema.parse(filters);
  const parsed = paginationSchema.parse(pagination);
  const validPagination = {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 50,
  };

  return getActiveAlerts(user, validFilters, validPagination);
}

export async function fetchSlaBreaches(filters: any, pagination: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);
  const validFilters = filterSchema.parse(filters);
  const parsed = paginationSchema.parse(pagination);
  const validPagination = {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 50,
  };

  return getSlaBreaches(user, validFilters, validPagination);
}

export async function fetchStuckWorkflow(filters: any, pagination: any) {
  noStore();
  const user = await getAuthenticatedUser();
  enforceCommandCenterRead(user);
  const validFilters = filterSchema.parse(filters);
  const parsed = paginationSchema.parse(pagination);
  const validPagination = {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 50,
  };

  return getStuckWorkflow(user, validFilters, validPagination);
}
