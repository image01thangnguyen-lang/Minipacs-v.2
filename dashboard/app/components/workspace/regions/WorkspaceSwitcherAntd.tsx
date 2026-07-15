"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Select } from "antd";
import { navigationRegistry } from "../../navigation/navigation-registry";
import { filterNavigationTree, findActiveNavigationItem } from "../../navigation/navigation-utils";
import type { NavigationNode } from "../../navigation/navigation-types";

function flattenNavigationNodes(nodes: NavigationNode[]): any[] {
  const options: any[] = [];
  nodes.forEach(node => {
    if (node.type === "group") {
      options.push({
        label: node.label,
        options: node.children.map(item => ({
          label: item.label,
          value: item.type === "item" ? item.href : item.id,
        }))
      });
    } else {
      options.push({
        label: node.label,
        value: node.href,
      });
    }
  });
  return options;
}

export function WorkspaceSwitcherAntd({
  role,
  permissions,
}: {
  role: string;
  permissions: readonly string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const nodes = filterNavigationTree(role, permissions, navigationRegistry);
  const options = useMemo(() => flattenNavigationNodes(nodes), [nodes]);
  const { activeItem } = findActiveNavigationItem(pathname, navigationRegistry);

  return (
    <div className="relative z-40 flex-none border-b border-[#303030] px-2 py-1.5 bg-[#1F1F1F]">
      <div className="flex flex-col mb-1">
        <span className="text-[10px] text-gray-400">Chuyển đổi màn hình</span>
      </div>
      <Select
        size="middle"
        className="w-full"
        showSearch
        placeholder="Chọn màn hình..."
        value={activeItem ? activeItem.href : undefined}
        options={options}
        onChange={(path) => {
          if (path) router.push(path);
        }}
        filterOption={(input, option) =>
          (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
        }
      />
    </div>
  );
}
