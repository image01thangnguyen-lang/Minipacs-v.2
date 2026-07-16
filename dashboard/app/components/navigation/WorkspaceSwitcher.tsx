"use client";

import { useMemo } from "react";
import { Select } from "antd";
import { useRouter } from "next/navigation";
import type { NavigationNode, NavigationItem } from "./navigation-types";

type NavigationOption = {
  label: string;
  value: string;
  searchText: string;
};

type NavigationOptionGroup = {
  label: string;
  options: NavigationOption[];
};

function collectLeafOptions(
  nodes: NavigationNode[],
  parentLabels: string[] = [],
): NavigationOption[] {
  return nodes.flatMap((node) => {
    if (node.type === "item") {
      const breadcrumb = [...parentLabels, node.label];
      return [{
        label: parentLabels.length > 0
          ? `${parentLabels.slice(1).join(" / ")}${parentLabels.length > 1 ? " / " : ""}${node.label}`
          : node.label,
        value: node.href,
        searchText: breadcrumb.join(" "),
      }];
    }

    return collectLeafOptions(node.children, [...parentLabels, node.label]);
  });
}

function buildNavigationOptions(nodes: NavigationNode[]): Array<NavigationOption | NavigationOptionGroup> {
  return nodes.map((node) => {
    if (node.type === "item") {
      return {
        label: node.label,
        value: node.href,
        searchText: node.label,
      };
    }

    return {
      label: node.label,
      options: collectLeafOptions(node.children, [node.label]),
    };
  });
}

export function WorkspaceSwitcher({
  nodes,
  activeItem,
  onNavigate,
}: {
  nodes: NavigationNode[];
  activeItem: NavigationItem | null;
  activeAncestors: string[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const options = useMemo(() => buildNavigationOptions(nodes), [nodes]);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-sm text-vin-muted">Chuyển đổi màn hình</span>
      <Select
        aria-label="Chuyển đổi màn hình"
        className="w-full"
        showSearch
        size="middle"
        placeholder="Chọn màn hình..."
        value={activeItem?.href}
        options={options}
        optionFilterProp="searchText"
        filterOption={(input, option) =>
          String(option?.searchText ?? option?.label ?? "")
            .toLocaleLowerCase("vi")
            .includes(input.toLocaleLowerCase("vi"))
        }
        onChange={(href: string) => {
          onNavigate?.();
          router.push(href);
        }}
        popupMatchSelectWidth={320}
        listHeight={420}
      />
    </div>
  );
}
