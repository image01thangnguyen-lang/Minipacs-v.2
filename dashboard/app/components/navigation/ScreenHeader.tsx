"use client";

import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { filterNavigationTree, findActiveNavigationItem } from "./navigation-utils";
import { navigationRegistry } from "./navigation-registry";
import type { NavigationNode } from "./navigation-types";

/**
 * ScreenHeader replaces the per-page <h1> title.
 * It renders inline: WorkspaceSwitcher (left) + optional extras + user/logout (right).
 * Pages embed this where their title used to be — no extra global header row.
 */
export function ScreenHeader({
  extraContent,
}: {
  extraContent?: React.ReactNode;
}) {
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* WorkspaceSwitcher replaces the old page title */}
        {!sessionState.loading && !sessionState.error && filteredTree.length > 0 ? (
          <div className="w-56">
            <WorkspaceSwitcher
              nodes={filteredTree}
              activeItem={activeItem}
              activeAncestors={ancestorIds}
            />
          </div>
        ) : (
          <div className="text-sm font-bold text-white">
            {activeItem?.label || "MiniPACS"}
          </div>
        )}
        {extraContent}
      </div>

      {/* User info + Logout */}
      <div className="flex items-center gap-3">
        {sessionState.userInfo && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-vin-shell border border-vin-border">
              <User className="h-3.5 w-3.5 text-vin-muted" />
            </div>
            <span className="hidden md:inline truncate text-sm font-semibold text-white max-w-[120px]">
              {sessionState.userInfo.fullName || sessionState.userInfo.username}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Đăng xuất"
          className="flex h-7 items-center justify-center gap-1.5 rounded px-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut className={`h-3.5 w-3.5 flex-shrink-0 ${loggingOut ? "animate-pulse" : ""}`} />
          <span className="hidden md:inline">{loggingOut ? "Đang thoát..." : "Thoát"}</span>
        </button>
      </div>
    </div>
  );
}
