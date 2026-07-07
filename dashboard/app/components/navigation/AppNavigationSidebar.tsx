"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { LogOut, Menu, X, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { PermissionAwareNavigationTree } from "./PermissionAwareNavigationTree";
import { filterNavigationTree, findActiveNavigationItem } from "./navigation-utils";
import { navigationRegistry } from "./navigation-registry";
import type { NavigationNode } from "./navigation-types";

export function AppNavigationSidebar() {
  const [collapsed, setCollapsedState] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("minipacs.navigation.collapsed.v1");
      if (stored !== null) setCollapsedState(stored === "true");
    }
  }, []);

  const [loggingOut, setLoggingOut] = useState(false);
  
  const [sessionState, setSessionState] = useState<{
    role: string | null;
    permissions: string[] | null;
    userInfo: { username?: string; fullName?: string } | null;
    loading: boolean;
    error: boolean;
  }>({
    role: null,
    permissions: null,
    userInfo: null,
    loading: true,
    error: false,
  });

  const pathname = usePathname() || "/";

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("minipacs.navigation.collapsed.v1", String(val));
    }
  };

  useEffect(() => {
    let mounted = true;
    getSession()
      .then(session => {
        if (mounted) {
          if (!session) {
             setSessionState(prev => ({ ...prev, loading: false, error: true }));
             return;
          }
          setSessionState({
            role: session?.user?.role || null,
            permissions: session?.user?.permissions || null,
            userInfo: session?.user ? {
              username: (session.user as any).username || session.user.name,
              fullName: (session.user as any).fullName || session.user.name
            } : null,
            loading: false,
            error: false,
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setSessionState(prev => ({ ...prev, loading: false, error: true }));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  let filteredTree: NavigationNode[] = [];
  if (!sessionState.loading && !sessionState.error && sessionState.role) {
    filteredTree = filterNavigationTree(sessionState.role, sessionState.permissions, navigationRegistry);
  }

  const { activeItem, ancestorIds } = findActiveNavigationItem(pathname, navigationRegistry);

  return (
    <aside
      className={`relative flex h-full flex-none flex-col border-r border-vin-border bg-vin-sidebar transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="border-b border-vin-border px-2 py-2.5">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-[34px] w-full items-center justify-center rounded text-vin-muted transition-colors hover:bg-vin-panel hover:text-white focus:outline-none focus:ring-2 focus:ring-vin-accent"
            title="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex flex-col gap-3 pb-1">
            <div className="flex h-[34px] items-center justify-between pl-2">
              <div>
                <div className="text-sm font-bold leading-tight text-white">Mini PACS</div>
                <div className="text-[10px] uppercase tracking-wide text-vin-muted">RIS Dashboard</div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-vin-muted transition-colors hover:bg-vin-panel hover:text-white focus:outline-none focus:ring-2 focus:ring-vin-accent"
                title="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="px-1">
              <WorkspaceSwitcher 
                nodes={filteredTree} 
                activeItem={activeItem} 
                activeAncestors={ancestorIds}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 scr-dark">
        {sessionState.loading ? (
          <div className="flex justify-center p-4">
             <div className="h-5 w-5 animate-spin rounded-full border-2 border-vin-accent border-t-transparent" />
          </div>
        ) : sessionState.error ? (
          <div className="p-4 text-center text-xs text-red-400">
            Lỗi tải phiên đăng nhập. Vui lòng tải lại trang.
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-vin-muted">
            Tài khoản chưa được cấp màn hình làm việc
          </div>
        ) : (
          <PermissionAwareNavigationTree
            nodes={filteredTree}
            activeItem={activeItem}
            activeAncestors={ancestorIds}
            collapsedSidebar={collapsed}
          />
        )}
      </div>

      <div className="border-t border-vin-border px-2 py-2.5">
        {collapsed ? (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="flex w-full items-center justify-center rounded py-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
          </button>
        ) : sessionState.userInfo ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-vin-shell border border-vin-border">
              <User className="h-4 w-4 text-vin-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-white">{sessionState.userInfo.fullName || sessionState.userInfo.username}</div>
              {sessionState.userInfo.fullName && sessionState.userInfo.username && (
                <div className="truncate text-[9px] text-vin-muted">@{sessionState.userInfo.username}</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Đăng xuất"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className={`h-4 w-4 ${loggingOut ? "animate-pulse" : ""}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-[12px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
            <span className="truncate">{loggingOut ? "Đang xuất..." : "Đăng xuất"}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
