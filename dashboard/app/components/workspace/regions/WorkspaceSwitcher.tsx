"use client";

import { usePathname } from "next/navigation";
import { WorkspaceSwitcher as NavigationWorkspaceSwitcher } from "../../navigation/WorkspaceSwitcher";
import { navigationRegistry } from "../../navigation/navigation-registry";
import { filterNavigationTree, findActiveNavigationItem } from "../../navigation/navigation-utils";

/**
 * Bộ chuyển màn của workspace bác sĩ dùng chung registry toàn hệ thống.
 * Vì vậy mọi màn hình mới thêm vào registry sẽ tự xuất hiện tại đây và vẫn
 * tuân thủ quyền của tài khoản, thay vì duy trì một danh sách link rút gọn.
 */
export function WorkspaceSwitcher({
  role,
  permissions,
}: {
  role: string;
  permissions: readonly string[];
}) {
  const pathname = usePathname();
  const nodes = filterNavigationTree(role, permissions, navigationRegistry);
  const { activeItem, ancestorIds } = findActiveNavigationItem(pathname, navigationRegistry);

  return (
    <div className="relative z-40 flex-none border-b border-vin-border/70 px-2 py-1.5">
      <NavigationWorkspaceSwitcher
        nodes={nodes}
        activeItem={activeItem}
        activeAncestors={ancestorIds}
      />
    </div>
  );
}
