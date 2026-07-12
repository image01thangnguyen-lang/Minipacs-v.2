"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { PermissionAwareNavigationTree } from "./PermissionAwareNavigationTree";
import type { NavigationNode, NavigationItem } from "./navigation-types";

export function WorkspaceSwitcher({
  nodes,
  activeItem,
  activeAncestors,
  onNavigate,
}: {
  nodes: NavigationNode[];
  activeItem: NavigationItem | null;
  activeAncestors: string[];
  onNavigate?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    triggerRef.current?.focus();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        closeDropdown();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => {
          if (!isOpen) setSearchQuery("");
          setIsOpen(!isOpen);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-colors hover:bg-vin-panel focus:outline-none focus:ring-2 focus:ring-vin-accent"
      >
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-xs font-bold text-white">
            {activeItem ? activeItem.label : "MiniPACS Workspace"}
          </span>
          <span className="truncate text-[10px] text-vin-muted">Chuyển đổi màn hình</span>
        </div>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-vin-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-64 max-h-[80vh] flex flex-col overflow-hidden rounded-md border border-vin-border bg-vin-sidebar shadow-lg"
          role="dialog"
          aria-label="Workspace Switcher"
        >
          <div className="p-2 border-b border-vin-border">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm màn hình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-vin-border bg-vin-shell px-2 py-1 text-xs text-white placeholder-vin-muted focus:border-vin-accent focus:outline-none focus:ring-1 focus:ring-vin-accent"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto scr-dark p-2">
            <PermissionAwareNavigationTree
              nodes={nodes}
              activeItem={activeItem}
              activeAncestors={activeAncestors}
              onNavigate={() => {
                setIsOpen(false);
                setSearchQuery("");
                onNavigate?.();
              }}
              expandedByDefault={true}
              collapsedSidebar={false}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      )}
    </div>
  );
}
