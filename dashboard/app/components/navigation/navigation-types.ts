import type { PermissionKey } from "../../../lib/permissions";

export type NavigationIconKey = string;

export type NavigationGroup = {
  type: "group";
  id: string;
  label: string;
  iconKey?: NavigationIconKey;
  children: NavigationNode[];
};

export type NavigationItem = {
  type: "item";
  id: string;
  label: string;
  href: string;
  iconKey: NavigationIconKey;
  permission: PermissionKey;
  match?: "exact" | "prefix";
  aliases?: string[];
};

export type NavigationNode = NavigationGroup | NavigationItem;
