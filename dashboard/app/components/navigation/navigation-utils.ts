import type { NavigationNode, NavigationItem } from "./navigation-types";
import { hasPermission } from "../../../lib/permissions";

export function filterNavigationTree(
  role: string | null | undefined,
  explicitPermissions: readonly string[] | null | undefined,
  nodes: NavigationNode[]
): NavigationNode[] {
  const result: NavigationNode[] = [];

  for (const node of nodes) {
    if (node.type === "item") {
      if (hasPermission(role, node.permission, explicitPermissions)) {
        result.push(node);
      }
    } else if (node.type === "group") {
      const filteredChildren = filterNavigationTree(role, explicitPermissions, node.children);
      if (filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
  }

  return result;
}

function normalizePath(pathname: string): string {
  const pathWithoutQuery = pathname.split("?")[0].split("#")[0];
  if (pathWithoutQuery !== "/" && pathWithoutQuery.endsWith("/")) {
    return pathWithoutQuery.slice(0, -1);
  }
  return pathWithoutQuery;
}

export function findActiveNavigationItem(
  pathname: string,
  nodes: NavigationNode[]
): { activeItem: NavigationItem | null; ancestorIds: string[] } {
  const normalizedPath = normalizePath(pathname);
  const matches: { item: NavigationItem; ancestors: string[]; score: number }[] = [];

  function traverse(currentNodes: NavigationNode[], ancestors: string[]) {
    for (const node of currentNodes) {
      if (node.type === "item") {
        const hrefMatches = normalizedPath === node.href || node.aliases?.includes(normalizedPath);
        
        if (node.match === "exact") {
          if (hrefMatches) {
            matches.push({ item: node, ancestors, score: Number.MAX_SAFE_INTEGER });
          }
        } else {
          // prefix match
          if (hrefMatches) {
             matches.push({ item: node, ancestors, score: Number.MAX_SAFE_INTEGER });
          } else if (normalizedPath.startsWith(node.href + "/")) {
             matches.push({ item: node, ancestors, score: node.href.length });
          }
        }
      } else if (node.type === "group") {
        traverse(node.children, [...ancestors, node.id]);
      }
    }
  }

  traverse(nodes, []);

  if (matches.length === 0) {
    return { activeItem: null, ancestorIds: [] };
  }

  matches.sort((a, b) => b.score - a.score);
  return { activeItem: matches[0].item, ancestorIds: matches[0].ancestors };
}

export function getAncestorIds(activeId: string, nodes: NavigationNode[], currentAncestors: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.type === "item") {
      if (node.id === activeId) return currentAncestors;
    } else if (node.type === "group") {
      const found = getAncestorIds(activeId, node.children, [...currentAncestors, node.id]);
      if (found) return found;
    }
  }
  return null;
}
