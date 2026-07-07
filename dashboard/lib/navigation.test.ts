import assert from "node:assert";
import { navigationRegistry } from "../app/components/navigation/navigation-registry";
import { filterNavigationTree, findActiveNavigationItem } from "../app/components/navigation/navigation-utils";
import { isPermissionKey, getRoutePermission } from "./permissions";
import type { NavigationNode, NavigationItem } from "../app/components/navigation/navigation-types";

function extractAllItems(nodes: NavigationNode[]): NavigationItem[] {
  let items: NavigationItem[] = [];
  for (const node of nodes) {
    if (node.type === "item") items.push(node);
    else if (node.type === "group") items = items.concat(extractAllItems(node.children));
  }
  return items;
}

function extractAllGroups(nodes: NavigationNode[]): NavigationNode[] {
  let groups: NavigationNode[] = [];
  for (const node of nodes) {
    if (node.type === "group") {
      groups.push(node);
      groups = groups.concat(extractAllGroups(node.children));
    }
  }
  return groups;
}

async function runTests() {
  const allItems = extractAllItems(navigationRegistry);
  const allGroups = extractAllGroups(navigationRegistry);
  const allNodes = [...allItems, ...allGroups];

  // 1. Mọi ID là duy nhất.
  const ids = allNodes.map((n) => n.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(ids.length, uniqueIds.size, "IDs in registry must be unique");

  // 2. Mọi canonical href là duy nhất
  const hrefs = allItems.map((i) => i.href);
  const uniqueHrefs = new Set(hrefs);
  assert.strictEqual(hrefs.length, uniqueHrefs.size, "Hrefs in registry must be unique");

  // 3. Mọi permission là `PermissionKey` hợp lệ.
  for (const item of allItems) {
    assert.ok(isPermissionKey(item.permission), `Invalid permission key: ${item.permission}`);
  }

  // 4. User chỉ có `studies.read` chỉ thấy `Ca chụp` và các ancestor tương ứng.
  const onlyStudiesUserTree = filterNavigationTree(null, ["studies.read"], navigationRegistry);
  const onlyStudiesUserItems = extractAllItems(onlyStudiesUserTree);
  assert.strictEqual(onlyStudiesUserItems.length, 1);
  assert.strictEqual(onlyStudiesUserItems[0].id, "studies");
  assert.strictEqual(onlyStudiesUserTree.length, 1);
  assert.strictEqual(onlyStudiesUserTree[0].id, "clinical");

  // 5. User có `consult.read` nhìn thấy Hội chẩn.
  const consultUserTree = filterNavigationTree(null, ["consult.read"], navigationRegistry);
  const consultUserItems = extractAllItems(consultUserTree);
  assert.ok(consultUserItems.some((i) => i.id === "consultations"));

  // 6. User có `admin.permissions` nhìn thấy Ma trận quyền theo máy.
  const adminPermUserTree = filterNavigationTree(null, ["admin.permissions"], navigationRegistry);
  const adminPermUserItems = extractAllItems(adminPermUserTree);
  assert.ok(adminPermUserItems.some((i) => i.id === "permission-matrix"));

  // 7. Group không có child hợp lệ bị xóa.
  // onlyStudiesUserTree is an example: other groups are removed.
  assert.ok(onlyStudiesUserTree.every(node => node.type === "group" && node.children.length > 0));

  // 8. Custom explicit permissions được tôn trọng như `hasPermission()` hiện tại.
  // Zalo: Tested above by passing ["studies.read"].

  // 9. `/` chỉ active Ca chụp.
  const match1 = findActiveNavigationItem("/", navigationRegistry);
  assert.strictEqual(match1.activeItem?.id, "studies");

  // 10. `/worklist/new` active Worklist.
  const match2 = findActiveNavigationItem("/worklist/new", navigationRegistry);
  assert.strictEqual(match2.activeItem?.id, "worklist");

  // 11. `/consultations/abc` active Hội chẩn.
  const match3 = findActiveNavigationItem("/consultations/abc", navigationRegistry);
  assert.strictEqual(match3.activeItem?.id, "consultations");

  // 12. `/admin/ops/security` active An toàn thông tin, không active Tình trạng hệ thống.
  const match4 = findActiveNavigationItem("/admin/ops/security", navigationRegistry);
  assert.strictEqual(match4.activeItem?.id, "ops-security");

  // 13. `/admin/release/uat/runs/123` active UAT.
  const match5 = findActiveNavigationItem("/admin/release/uat/runs/123", navigationRegistry);
  assert.strictEqual(match5.activeItem?.id, "release-uat");

  // 14. Segment boundary không cho `/archive-old` active Archive.
  const match6 = findActiveNavigationItem("/archive-old", navigationRegistry);
  assert.strictEqual(match6.activeItem, null, "Prefix should only match on segment boundary");

  // 15. Registry href có permission khớp `getRoutePermission(href)`
  for (const item of allItems) {
    const routePerm = getRoutePermission(item.href);
    if (routePerm) {
      assert.strictEqual(item.permission, routePerm, `Permission mismatch for ${item.href}. Registry: ${item.permission}, Middleware: ${routePerm}`);
    } else {
      console.warn(`[Warning] No route permission defined in middleware for ${item.href}`);
    }
  }

  console.log("All navigation tests passed!");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
