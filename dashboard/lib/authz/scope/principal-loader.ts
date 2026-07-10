import type { ScopePrincipal } from "./scope-decision";
import type { ScopeRequestContext } from "./scope-request-context";
import { getPermissionsForRole } from "../../permissions";

/**
 * Dependencies for loading user data from the authoritative source (DB).
 * Never trust role/permission data from the client session.
 */
export type PrincipalLoaderDeps = {
  findUserById: (userId: string) => Promise<{
    id: string;
    role: string;
    isActive: boolean;
    roleProfileId: string | null;
    roleProfile: {
      id: string;
      permissions: string[];
      isActive: boolean;
      baseRole: string;
    } | null;
  } | null>;
};

/**
 * Loads a ScopePrincipal from the database, computing effective permissions
 * server-side. Uses request-scoped caching to avoid duplicate loads.
 *
 * Returns null if the user does not exist or is inactive.
 */
export async function loadPrincipal(
  userId: string,
  deps: PrincipalLoaderDeps,
  ctx?: ScopeRequestContext
): Promise<ScopePrincipal | null> {
  // Check cache
  if (ctx) {
    const cached = ctx.getPrincipal(userId);
    if (cached) return cached;
  }

  const user = await deps.findUserById(userId);
  if (!user) return null;

  // Determine effective role profile
  const activeProfile = user.roleProfile?.isActive ? user.roleProfile : null;
  const baseRole = user.role;

  // Compute permissions server-side using the same logic as auth.ts
  // but from fresh DB data, not stale session tokens
  const globalPermissions = getPermissionsForRole(
    baseRole,
    activeProfile?.permissions
  );

  const principal: ScopePrincipal = {
    userId: user.id,
    baseRole,
    roleProfileId: activeProfile?.id || null,
    globalPermissions: [...globalPermissions],
    isActive: user.isActive,
  };

  // Cache for this request
  if (ctx) {
    ctx.setPrincipal(userId, principal);
  }

  return principal;
}
