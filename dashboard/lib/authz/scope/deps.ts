import { prisma } from "@/app/db";
import type { ScopeResolverDeps } from "./scope-resolver";
import type { FilterBuilderDeps } from "./scope-filter-builder";
import type { ResourceContextDeps } from "./resource-context";

/**
 * Creates the production dependencies for scope resolution and filtering.
 */
export function getScopeDeps(): ScopeResolverDeps & FilterBuilderDeps & ResourceContextDeps {
  return {
    findUserById: async (id) => prisma.user.findUnique({
      where: { id },
      include: { roleProfile: true }
    }) as any,

    findDicomNodesByAeTitle: (aeTitle) => prisma.dicomNode.findMany({
      where: { aeTitle },
      select: { id: true, aeTitle: true, isActive: true, facilityId: true }
    }),

    findAllGrantsForUser: async (userId, capability) => prisma.accessScopeGrant.findMany({
      where: { userId, capability },
      include: { facilityUnit: { select: { isActive: true } }, dicomNode: { select: { isActive: true, facilityId: true, aeTitle: true } } }
    }),

    findAllGrantsForRoleProfile: async (roleProfileId, capability) => prisma.accessScopeGrant.findMany({
      where: { roleProfileId, capability },
      include: { facilityUnit: { select: { isActive: true } }, dicomNode: { select: { isActive: true, facilityId: true, aeTitle: true } } }
    }),

    findGrantsByUserAndCapability: (userId, capability) => prisma.accessScopeGrant.findMany({
      where: { userId, capability },
      include: { facilityUnit: { select: { isActive: true } }, dicomNode: { select: { isActive: true, facilityId: true, aeTitle: true } } }
    }),

    findGrantsByRoleProfileAndCapability: (roleProfileId, capability) => prisma.accessScopeGrant.findMany({
      where: { roleProfileId, capability },
      include: { facilityUnit: { select: { isActive: true } }, dicomNode: { select: { isActive: true, facilityId: true, aeTitle: true } } }
    }),

    findLegacyPermissions: (userId, actionKey) => prisma.doctorMachinePermission.findMany({
      where: { doctorId: userId, actionKey },
      select: { id: true, doctorId: true, dicomNodeId: true, actionKey: true, allow: true }
    }),

    findDeniedAeTitles: async (userId, actionKey) => {
      const denied = await prisma.doctorMachinePermission.findMany({
        where: { doctorId: userId, actionKey, allow: false },
        select: { dicomNode: { select: { aeTitle: true } } }
      });
      return denied.map(d => d.dicomNode.aeTitle).filter(Boolean);
    },

    findAllowedLegacyAeTitles: async (userId, actionKey) => {
      const allowed = await prisma.doctorMachinePermission.findMany({
        where: { doctorId: userId, actionKey, allow: true },
        select: { dicomNodeId: true, dicomNode: { select: { aeTitle: true } } }
      });
      return allowed.map(a => ({ aeTitle: a.dicomNode.aeTitle, dicomNodeId: a.dicomNodeId }));
    },

    findUniqueActiveAeTitles: async () => {
      const nodes = await prisma.dicomNode.findMany({
        where: { isActive: true },
        select: { aeTitle: true }
      });
      // Filter out empty and duplicates
      const counts = new Map<string, number>();
      for (const node of nodes) {
        if (node.aeTitle) {
          counts.set(node.aeTitle, (counts.get(node.aeTitle) || 0) + 1);
        }
      }
      return Array.from(counts.entries())
        .filter(([_, count]) => count === 1)
        .map(([ae, _]) => ae);
    },

    findDicomNodeById: async (id) => prisma.dicomNode.findUnique({
      where: { id },
      select: { id: true, facilityId: true, aeTitle: true, isActive: true }
    }),

    findFacilityUnitExists: async (id) => {
      const count = await prisma.facilityUnit.count({ where: { id, isActive: true } });
      return count > 0;
    }
  };
}
