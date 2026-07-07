import { prisma } from "../../../app/db";
import { OrganizationIntegrityError, OrganizationTree } from "./organization-tree";
import { Prisma } from "@prisma/client";

export type FacilityUnitCreateInput = {
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  actorUserId: string;
};

export type FacilityUnitMoveInput = {
  unitId: string;
  newParentId: string | null;
  actorUserId: string;
};

export type DeactivateStrategy = "BLOCK" | "CASCADE";

export type FacilityUnitDeactivateInput = {
  unitId: string;
  actorUserId: string;
  strategy: DeactivateStrategy;
};

export type FacilityUnitReactivateInput = {
  unitId: string;
  actorUserId: string;
};

export type FacilityUnitUpdateInput = {
  unitId: string;
  name?: string;
  actorUserId: string;
};

export type AssignDicomNodeInput = {
  nodeId: string;
  facilityId: string | null;
  actorUserId: string;
};

export type ReactivateDicomNodeInput = {
  nodeId: string;
  actorUserId: string;
};

async function executeWithRetry<T>(
  action: () => Promise<T>,
  retries = 3
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await action();
    } catch (error: any) {
      if (error.code === 'P2034' && attempt < retries - 1) {
        attempt++;
        // short delay before retry
        await new Promise(r => setTimeout(r, 50 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}

export class OrganizationService {
  async previewMoveImpact(unitId: string): Promise<{ affectedDescendants: number, affectedMachines: number, affectedGrants: number }> {
    const units = await prisma.facilityUnit.findMany({ where: { isActive: true } });
    const tree = new OrganizationTree(units as any);
    const descendants = tree.getDescendantIds(unitId);

    const affectedIds = [unitId, ...descendants];
    const machinesCount = await prisma.dicomNode.count({
      where: { facilityId: { in: affectedIds }, isActive: true }
    });

    const machines = await prisma.dicomNode.findMany({
      where: { facilityId: { in: affectedIds } },
      select: { id: true }
    });
    const affectedMachineIds = machines.map(m => m.id);

    const grantsCount = await prisma.accessScopeGrant.count({
      where: {
        OR: [
          { facilityUnitId: { in: affectedIds } },
          { dicomNodeId: { in: affectedMachineIds } }
        ]
      }
    });

    return {
      affectedDescendants: descendants.length,
      affectedMachines: machinesCount,
      affectedGrants: grantsCount
    };
  }

  async previewDeactivateImpact(unitId: string): Promise<{ affectedDescendants: number; affectedMachines: number }> {
    const units = await prisma.facilityUnit.findMany({ where: { isActive: true } });
    const tree = new OrganizationTree(units as any);
    const descendants = tree.getDescendantIds(unitId);
    
    const machinesCount = await prisma.dicomNode.count({
      where: { facilityId: { in: [unitId, ...descendants] }, isActive: true }
    });

    return { 
      affectedDescendants: descendants.length,
      affectedMachines: machinesCount 
    };
  }

  async createFacilityUnit(input: FacilityUnitCreateInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const existing = await tx.facilityUnit.findUnique({ where: { code: input.code } });
      if (existing) {
        throw new Error(`FacilityUnit with code ${input.code} already exists.`);
      }

      let parentNode = null;
      if (input.parentId) {
        parentNode = await tx.facilityUnit.findUnique({ where: { id: input.parentId } });
        if (!parentNode) throw new Error("Parent not found");
        if (!parentNode.isActive) throw new Error("Cannot attach to an inactive parent");
      }

      const activeUnits = await tx.facilityUnit.findMany({ where: { isActive: true } });
      const tree = new OrganizationTree(activeUnits as any);
      
      const isValid = tree.validateTaxonomyRule(parentNode?.type || null, input.type);
      if (!isValid) {
        throw new Error(`Taxonomy rule violation: cannot place ${input.type} under ${parentNode?.type || 'ROOT'}`);
      }

      const unit = await tx.facilityUnit.create({
        data: {
          code: input.code,
          name: input.name,
          type: input.type,
          parentId: input.parentId,
          isActive: true
        }
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_FACILITY_UNIT",
          entityId: unit.id,
          entityType: "FACILITY_UNIT",
          actorUserId: input.actorUserId,
          metadataJson: JSON.stringify(input)
        }
      });

      return unit;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async moveFacilityUnit(input: FacilityUnitMoveInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const unit = await tx.facilityUnit.findUnique({ where: { id: input.unitId } });
      if (!unit) throw new Error("Unit not found");

      let parentNode = null;
      if (input.newParentId) {
        parentNode = await tx.facilityUnit.findUnique({ where: { id: input.newParentId } });
        if (!parentNode) throw new Error("Parent not found");
        if (!parentNode.isActive) throw new Error("Cannot attach to an inactive parent");
      }

      const activeUnits = await tx.facilityUnit.findMany({ where: { isActive: true } });
      const tree = new OrganizationTree(activeUnits as any);

      if (tree.wouldCreateCycle(input.unitId, input.newParentId)) {
        throw new OrganizationIntegrityError("Move would create a cycle");
      }

      const isValid = tree.validateTaxonomyRule(parentNode?.type || null, unit.type);
      if (!isValid) {
        throw new Error(`Taxonomy rule violation: cannot place ${unit.type} under ${parentNode?.type || 'ROOT'}`);
      }

      const updated = await tx.facilityUnit.update({
        where: { id: input.unitId },
        data: { parentId: input.newParentId }
      });

      await tx.auditLog.create({
        data: {
          action: "MOVE_FACILITY_UNIT",
          entityId: updated.id,
          entityType: "FACILITY_UNIT",
          actorUserId: input.actorUserId,
          metadataJson: JSON.stringify({ from: unit.parentId, to: input.newParentId })
        }
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async deactivateFacilityUnit(input: FacilityUnitDeactivateInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const unit = await tx.facilityUnit.findUnique({ where: { id: input.unitId } });
      if (!unit) throw new Error("Unit not found");
      if (!unit.isActive) {
        return {
          unit,
          affectedDescendants: 0,
          affectedMachines: 0
        };
      }

      const activeUnits = await tx.facilityUnit.findMany({ where: { isActive: true } });
      const tree = new OrganizationTree(activeUnits as any);
      
      const descendants = tree.getDescendantIds(input.unitId);
      const affectedIds = [input.unitId, ...descendants];

      const machinesCount = await tx.dicomNode.count({
        where: { facilityId: { in: affectedIds }, isActive: true }
      });

      if (input.strategy === "BLOCK") {
        if (descendants.length > 0) {
          throw new Error("Cannot deactivate: unit has active children. Please reassign them or use CASCADE.");
        }
        if (machinesCount > 0) {
          throw new Error("Cannot deactivate: unit has active DICOM machines. Please reassign them or use CASCADE.");
        }
      }

      await tx.facilityUnit.updateMany({
        where: { id: { in: affectedIds } },
        data: { isActive: false }
      });

      if (input.strategy === "CASCADE") {
        await tx.dicomNode.updateMany({
          where: { facilityId: { in: affectedIds }, isActive: true },
          data: { isActive: false }
        });
      }

      await tx.auditLog.create({
        data: {
          action: "DEACTIVATE_FACILITY_UNIT",
          entityId: input.unitId,
          entityType: "FACILITY_UNIT",
          actorUserId: input.actorUserId,
          metadataJson: JSON.stringify({ 
            strategy: input.strategy,
            affectedDescendants: descendants.length,
            affectedMachines: input.strategy === "CASCADE" ? machinesCount : 0
          })
        }
      });

      return {
        unit: { ...unit, isActive: false },
        affectedDescendants: descendants.length,
        affectedMachines: input.strategy === "CASCADE" ? machinesCount : 0
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async reactivateFacilityUnit(input: FacilityUnitReactivateInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const unit = await tx.facilityUnit.findUnique({ where: { id: input.unitId } });
      if (!unit) throw new Error("Unit not found");
      if (unit.isActive) return unit;

      if (unit.parentId) {
        const parent = await tx.facilityUnit.findUnique({ where: { id: unit.parentId } });
        if (!parent?.isActive) throw new Error("Cannot reactivate: parent unit is inactive");
      }

      const updated = await tx.facilityUnit.update({
        where: { id: input.unitId },
        data: { isActive: true }
      });

      await tx.auditLog.create({
        data: {
          action: "REACTIVATE_FACILITY_UNIT",
          entityId: input.unitId,
          entityType: "FACILITY_UNIT",
          actorUserId: input.actorUserId,
          metadataJson: "{}"
        }
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async updateFacilityUnit(input: FacilityUnitUpdateInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const unit = await tx.facilityUnit.findUnique({ where: { id: input.unitId } });
      if (!unit) throw new Error("Unit not found");

      const updated = await tx.facilityUnit.update({
        where: { id: input.unitId },
        data: {
          ...(input.name && { name: input.name }),
        }
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE_FACILITY_UNIT",
          entityId: updated.id,
          entityType: "FACILITY_UNIT",
          actorUserId: input.actorUserId,
          metadataJson: JSON.stringify({ name: input.name })
        }
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async assignDicomNode(input: AssignDicomNodeInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const node = await tx.dicomNode.findUnique({ where: { id: input.nodeId } });
      if (!node) throw new Error("Node not found");
      if (!node.isActive) throw new Error("Node is inactive");

      if (input.facilityId) {
        const facility = await tx.facilityUnit.findUnique({ where: { id: input.facilityId } });
        if (!facility) throw new Error("Facility not found");
        if (!facility.isActive) throw new Error("Facility is inactive");

        const allowedTypes = ['HOSPITAL', 'DEPARTMENT', 'SPECIALTY', 'ROOM'];
        if (!allowedTypes.includes(facility.type)) {
          throw new Error(`Không thể gán máy vào cấp độ ${facility.type}. Chỉ hỗ trợ: ${allowedTypes.join(', ')}`);
        }
      }

      const updated = await tx.dicomNode.update({
        where: { id: input.nodeId },
        data: { facilityId: input.facilityId },
      });

      await tx.auditLog.create({
        data: {
          action: "ORG_MACHINE_ASSIGNED",
          entityId: input.nodeId,
          entityType: "DICOM_NODE",
          actorUserId: input.actorUserId,
          metadataJson: JSON.stringify({ from: node.facilityId, to: input.facilityId }),
        }
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async reactivateDicomNode(input: ReactivateDicomNodeInput) {
    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      const node = await tx.dicomNode.findUnique({ where: { id: input.nodeId } });
      if (!node) throw new Error("Node not found");
      if (node.isActive) return node;

      if (node.facilityId) {
        const facility = await tx.facilityUnit.findUnique({ where: { id: node.facilityId } });
        if (facility && !facility.isActive) {
          throw new Error("Không thể khôi phục máy vì đơn vị quản lý đang ngừng hoạt động.");
        }
      }

      const updated = await tx.dicomNode.update({
        where: { id: input.nodeId },
        data: { isActive: true },
      });

      await tx.auditLog.create({
        data: {
          action: "REACTIVATE_DICOM_NODE",
          entityId: input.nodeId,
          entityType: "DICOM_NODE",
          actorUserId: input.actorUserId,
          metadataJson: "{}"
        }
      });

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }

  async reorderFacilityUnits(updates: { id: string; sortOrder: number }[], actorUserId: string) {
    if (!updates.length) throw new Error("Danh sách cập nhật trống.");

    return executeWithRetry(() => prisma.$transaction(async (tx) => {
      // 1. Load all requested nodes
      const requestedIds = updates.map(u => u.id);
      const uniqueIds = Array.from(new Set(requestedIds));
      if (uniqueIds.length !== requestedIds.length) {
        throw new Error("Danh sách chứa ID trùng lặp.");
      }

      const nodes = await tx.facilityUnit.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, parentId: true, sortOrder: true, name: true, isActive: true }
      });

      if (nodes.length !== uniqueIds.length) {
        const foundIds = new Set(nodes.map(n => n.id));
        const missing = uniqueIds.filter(id => !foundIds.has(id));
        throw new Error(`Không tìm thấy đơn vị: ${missing.join(', ')}`);
      }

      // 2. Verify all nodes share the same parent
      const parentIds = new Set(nodes.map(n => n.parentId));
      if (parentIds.size !== 1) {
        throw new Error("Tất cả đơn vị phải cùng một đơn vị cha.");
      }
      const commonParentId = nodes[0].parentId;

      // 3. Verify no siblings are missing
      const activeSiblings = await tx.facilityUnit.findMany({
        where: { parentId: commonParentId, isActive: true },
        select: { id: true, sortOrder: true, name: true, isActive: true }
      });
      const allSiblings = await tx.facilityUnit.findMany({
        where: { parentId: commonParentId },
        select: { id: true, sortOrder: true, name: true, isActive: true }
      });

      const requestedSet = new Set(uniqueIds);
      const matchesExactSet = (siblings: Array<{ id: string }>) =>
        siblings.length === requestedSet.size && siblings.every(sibling => requestedSet.has(sibling.id));
      const reordersAllSiblings = matchesExactSet(allSiblings);
      const reordersActiveSiblings = matchesExactSet(activeSiblings);

      if (!reordersAllSiblings && !reordersActiveSiblings) {
        throw new Error(
          `Cần gửi đầy đủ đơn vị cùng cấp (nhận ${uniqueIds.length}, nhưng hệ thống có ${activeSiblings.length} active và ${allSiblings.length} tổng).`
        );
      }

      // 4. Record before state
      const beforeOrder = [...allSiblings]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map(n => n.id);

      // 5. Normalize sortOrder to 0..N-1 based on client order
      const sortedUpdates = [...updates].sort((a, b) => a.sortOrder - b.sortOrder);
      const inactiveTail = reordersActiveSiblings
        ? allSiblings
            .filter(sibling => !sibling.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map(sibling => ({ id: sibling.id }))
        : [];
      const normalizedUpdates = [...sortedUpdates, ...inactiveTail].map((unit, index) => ({
        id: unit.id,
        sortOrder: index,
      }));

      // 6. Apply
      for (const u of normalizedUpdates) {
        await tx.facilityUnit.update({
          where: { id: u.id },
          data: { sortOrder: u.sortOrder }
        });
      }

      // 7. Record after state
      const afterOrder = normalizedUpdates
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(u => u.id);

      await tx.auditLog.create({
        data: {
          action: "REORDER_FACILITY_UNITS",
          entityId: commonParentId || "ROOT",
          entityType: "FACILITY_UNIT",
          actorUserId,
          metadataJson: JSON.stringify({ parentId: commonParentId, before: beforeOrder, after: afterOrder })
        }
      });
      return true;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }));
  }
}
