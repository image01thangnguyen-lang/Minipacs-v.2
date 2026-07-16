"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { NavigationNode, NavigationItem } from "./navigation-types";
import { NavigationIcons } from "./navigation-icons";

function filterTreeBySearch(nodes: NavigationNode[], query: string): NavigationNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();

  return nodes.reduce<NavigationNode[]>((acc, node) => {
    if (node.type === "item") {
      if (node.label.toLowerCase().includes(lowerQuery)) {
        acc.push(node);
      }
    } else {
      const filteredChildren = filterTreeBySearch(node.children, query);
      const groupMatches = node.label.toLowerCase().includes(lowerQuery);
      if (groupMatches) {
        acc.push(node);
      } else if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, []);
}

export function PermissionAwareNavigationTree({
  nodes,
  activeItem,
  activeAncestors,
  onNavigate,
  expandedByDefault = false,
  collapsedSidebar = false,
  searchQuery = "",
}: {
  nodes: NavigationNode[];
  activeItem: NavigationItem | null;
  activeAncestors: string[];
  onNavigate?: () => void;
  expandedByDefault?: boolean;
  collapsedSidebar?: boolean;
  searchQuery?: string;
}) {
  const displayNodes = searchQuery ? filterTreeBySearch(nodes, searchQuery) : nodes;

  return (
    <nav aria-label="Điều hướng chính" className="space-y-1">
      {displayNodes.length === 0 ? (
        <div className="text-sm text-vin-muted text-center py-4">Không tìm thấy kết quả.</div>
      ) : displayNodes.map((node, index) => (
        <NavigationNodeRenderer
          key={node.id}
          node={node}
          activeItem={activeItem}
          activeAncestors={activeAncestors}
          onNavigate={onNavigate}
          expandedByDefault={expandedByDefault}
          forceExpanded={Boolean(searchQuery)}
          collapsedSidebar={collapsedSidebar}
          level={0}
          isFirst={index === 0}
        />
      ))}
    </nav>
  );
}

function NavigationNodeRenderer({
  node,
  activeItem,
  activeAncestors,
  onNavigate,
  expandedByDefault,
  collapsedSidebar,
  level,
  isFirst,
  forceExpanded,
}: {
  node: NavigationNode;
  activeItem: NavigationItem | null;
  activeAncestors: string[];
  onNavigate?: () => void;
  expandedByDefault: boolean;
  collapsedSidebar: boolean;
  level: number;
  isFirst?: boolean;
  forceExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let initialExpanded = expandedByDefault || activeAncestors.includes(node.id);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("minipacs.navigation.expanded-groups.v1");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.includes(node.id)) initialExpanded = true;
        }
      } catch (e) {}
    }
    setIsExpanded(initialExpanded);
  }, [expandedByDefault, activeAncestors, node.id]);

  useEffect(() => {
    if (activeAncestors.includes(node.id)) {
      setIsExpanded(true);
    }
  }, [activeAncestors, node.id]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("minipacs.navigation.expanded-groups.v1");
        let parsed: string[] = [];
        if (stored) {
          parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) parsed = [];
        }
        if (next) {
          if (!parsed.includes(node.id)) parsed.push(node.id);
        } else {
          parsed = parsed.filter((id) => id !== node.id);
        }
        localStorage.setItem("minipacs.navigation.expanded-groups.v1", JSON.stringify(parsed));
      } catch (e) {}
    }
  };

  if (node.type === "item") {
    const isActive = activeItem?.id === node.id;
    const Icon = node.iconKey ? NavigationIcons[node.iconKey] : null;

    return (
      <Link
        href={node.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        title={collapsedSidebar ? node.label : undefined}
        className={`flex items-center gap-2 rounded py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-vin-accent ${
          isActive
            ? "bg-vin-tableSelected text-white"
            : "text-vin-text2 hover:bg-vin-panel hover:text-white"
        } ${collapsedSidebar ? "justify-center px-0" : "px-3"}`}
        style={!collapsedSidebar && level > 0 ? { paddingLeft: `${0.75 + level * 1.0}rem` } : undefined}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-vin-accent" aria-hidden="true" />}
        {!collapsedSidebar && <span className="truncate">{node.label}</span>}
      </Link>
    );
  }

  if (node.type === "group") {
    const Icon = node.iconKey ? NavigationIcons[node.iconKey] : null;

    if (collapsedSidebar) {
      return (
        <div className="space-y-1">
          {level === 0 && !isFirst && <div className="my-2 border-t border-vin-border/50" />}
          {node.children.map((child, idx) => (
            <NavigationNodeRenderer
              key={child.id}
              node={child}
              activeItem={activeItem}
              activeAncestors={activeAncestors}
              onNavigate={onNavigate}
              expandedByDefault={expandedByDefault}
              forceExpanded={forceExpanded}
              collapsedSidebar={collapsedSidebar}
              level={level + 1}
              isFirst={idx === 0}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {level === 0 && !isFirst && <div className="my-2" />}
        <button
          onClick={toggleExpand}
          aria-expanded={forceExpanded || isExpanded}
          aria-controls={`group-${node.id}`}
          className="group flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-sm font-bold uppercase tracking-wider text-vin-faint transition-colors hover:bg-vin-panel hover:text-white focus:outline-none focus:ring-2 focus:ring-vin-accent"
          style={level > 0 ? { paddingLeft: `${0.75 + level * 1.0}rem` } : undefined}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
            <span className="truncate">{node.label}</span>
          </div>
          <ChevronRight
            className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${(forceExpanded || isExpanded) ? "rotate-90 text-white" : "group-hover:text-white"}`}
          />
        </button>
        {(forceExpanded || isExpanded) && (
          <div id={`group-${node.id}`} className="space-y-1">
            {node.children.map((child, idx) => (
              <NavigationNodeRenderer
                key={child.id}
                node={child}
                activeItem={activeItem}
                activeAncestors={activeAncestors}
                onNavigate={onNavigate}
                expandedByDefault={expandedByDefault}
                forceExpanded={forceExpanded}
                collapsedSidebar={collapsedSidebar}
                level={level + 1}
                isFirst={idx === 0}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
