import { prisma } from "../../../app/db";
import { OrganizationTree } from "./organization-tree";

/**
 * Loads the active organization tree for the current request.
 * Request-scoped loading prevents stale cache between requests.
 */
export async function loadOrganizationTree(): Promise<OrganizationTree> {
  const units = await prisma.facilityUnit.findMany({
    where: { isActive: true },
    select: { id: true, type: true, parentId: true }
  });
  return new OrganizationTree(units);
}
