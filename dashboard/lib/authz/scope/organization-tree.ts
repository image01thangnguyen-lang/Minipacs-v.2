
import { FACILITY_UNIT_TYPES, type FacilityUnitType } from "./facility-types";

type OrgNode = {
  id: string;
  type: string;
  parentId: string | null;
  children: OrgNode[];
};

export class OrganizationIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationIntegrityError";
  }
}

export class OrganizationTree {
  private nodes: Map<string, OrgNode>;

  constructor(units: { id: string; type: string; parentId: string | null }[]) {
    this.nodes = new Map();
    
    for (const unit of units) {
      this.nodes.set(unit.id, {
        id: unit.id,
        type: unit.type,
        parentId: unit.parentId,
        children: []
      });
    }

    this.nodes.forEach((node) => {
      if (node.parentId) {
        const parent = this.nodes.get(node.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });
  }

  getDescendantIds(unitId: string): string[] {
    const node = this.nodes.get(unitId);
    if (!node) return [];

    const descendants: string[] = [];
    const queue = [...node.children];
    const visited = new Set<string>();
    visited.add(unitId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current.id)) {
        visited.add(current.id);
        descendants.push(current.id);
        queue.push(...current.children);
      } else {
        throw new OrganizationIntegrityError(`Cycle detected in descendants traversal at node ${current.id}`);
      }
    }
    return descendants;
  }

  getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  getAncestorIds(unitId: string): string[] {
    const ancestors: string[] = [];
    const visited = new Set<string>();
    visited.add(unitId);
    
    let current = this.nodes.get(unitId);

    while (current && current.parentId) {
      if (visited.has(current.parentId)) {
        // Cycle detected
        throw new OrganizationIntegrityError(`Cycle detected in ancestors traversal at node ${current.parentId}`);
      }
      visited.add(current.parentId);
      
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        ancestors.push(parent.id);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  wouldCreateCycle(unitId: string, newParentId: string | null): boolean {
    if (!newParentId) return false;
    if (unitId === newParentId) return true;
    
    const descendants = this.getDescendantIds(unitId);
    if (descendants.includes(newParentId)) return true;
    return false;
  }

  validateTaxonomyRule(parentType: string | null, childType: string): boolean {
    if (!parentType) {
      return childType === "CHAIN" || childType === "HOSPITAL";
    }

    const rules: Record<string, string[]> = {
      CHAIN: ["HOSPITAL"],
      HOSPITAL: ["DEPARTMENT", "SPECIALTY", "ROOM"],
      DEPARTMENT: ["SPECIALTY", "ROOM"],
      SPECIALTY: ["ROOM"],
      ROOM: []
    };

    const allowed = rules[parentType] || [];
    return allowed.includes(childType);
  }
}
