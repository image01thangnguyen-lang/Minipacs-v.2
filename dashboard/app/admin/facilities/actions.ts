"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import {
  OrganizationService,
  FacilityUnitCreateInput,
  FacilityUnitMoveInput,
  FacilityUnitDeactivateInput,
  FacilityUnitReactivateInput,
  FacilityUnitUpdateInput,
  AssignDicomNodeInput,
  ReactivateDicomNodeInput
} from "@/lib/authz/scope/organization-service";

const orgService = new OrganizationService();

export async function getOrganizationTreeAction(includeInactive = false) {
  await requirePermission("admin.facilities");
  const units = await prisma.facilityUnit.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });
  return units;
}

export async function createFacilityUnitAction(input: Omit<FacilityUnitCreateInput, "actorUserId">) {
  const actor = await requirePermission("admin.facilities");
  try {
    const unit = await orgService.createFacilityUnit({ ...input, actorUserId: actor.id });
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFacilityUnitAction(input: Omit<FacilityUnitUpdateInput, "actorUserId">) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.updateFacilityUnit({ ...input, actorUserId: actor.id });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function moveFacilityUnitAction(input: Omit<FacilityUnitMoveInput, "actorUserId">) {
  const actor = await requirePermission("admin.facilities");
  try {
    const unit = await orgService.moveFacilityUnit({ ...input, actorUserId: actor.id });
    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deactivateFacilityUnitAction(input: Omit<FacilityUnitDeactivateInput, "actorUserId">) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.deactivateFacilityUnit({ ...input, actorUserId: actor.id });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivateFacilityUnitAction(input: Omit<FacilityUnitReactivateInput, "actorUserId">) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.reactivateFacilityUnit({ ...input, actorUserId: actor.id });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function previewMoveImpactAction(unitId: string) {
  await requirePermission("admin.facilities");
  return orgService.previewMoveImpact(unitId);
}

export async function previewDeactivateImpactAction(unitId: string) {
  await requirePermission("admin.facilities");
  return orgService.previewDeactivateImpact(unitId);
}

export async function getDicomNodesMappingAction(includeInactive = false) {
  await requirePermission("admin.facilities");
  const nodes = await prisma.dicomNode.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, modality: true, aeTitle: true, facilityId: true, isActive: true },
  });
  return nodes;
}

export async function assignDicomNodeAction(nodeId: string, facilityId: string | null) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.assignDicomNode({ nodeId, facilityId, actorUserId: actor.id });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivateDicomNodeAction(nodeId: string) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.reactivateDicomNode({ nodeId, actorUserId: actor.id });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDataQualityMetricsAction() {
  await requirePermission("admin.facilities");

  // Unmapped active nodes
  const unmappedNodesCount = await prisma.dicomNode.count({
    where: { isActive: true, facilityId: null }
  });

  // Duplicate AE Titles
  const aeTitles = await prisma.dicomNode.groupBy({
    by: ['aeTitle'],
    where: { isActive: true, aeTitle: { not: "" } },
    _count: { aeTitle: true },
    having: { aeTitle: { _count: { gt: 1 } } }
  });

  const duplicateAeTitles = aeTitles.map(t => t.aeTitle);

  // Missing AE Titles
  const missingAeTitleNodesCount = await prisma.dicomNode.count({
    where: { isActive: true, aeTitle: "" }
  });

  // Orders without performingUnitId
  const unclassifiedOrdersCount = await prisma.worklistOrder.count({
    where: { performingUnitId: null }
  });

  // Studies without performingUnitId
  const unclassifiedStudiesCount = await prisma.imagingStudy.count({
    where: { performingUnitId: null }
  });

  return {
    unmappedNodesCount,
    duplicateAeTitlesCount: duplicateAeTitles.length,
    missingAeTitleNodesCount,
    unclassifiedOrdersCount,
    unclassifiedStudiesCount
  };
}

export async function reorderFacilityUnitsAction(updates: { id: string, sortOrder: number }[]) {
  const actor = await requirePermission("admin.facilities");
  try {
    const result = await orgService.reorderFacilityUnits(updates, actor.id);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
