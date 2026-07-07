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
  async previewMoveImpact(unitId: string): Promise<{ affectedDescendantCount: number }> {
    const units = await prisma.facilityUnit.findMany({ where: { isActive: true } });
    const tree = new OrganizationTree(units as any);
    const descendants = tree.getDescendantIds(unitId);
    return { affectedDescendantCount: descendants.length };
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
}
