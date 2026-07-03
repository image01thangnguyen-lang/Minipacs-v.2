import { prisma } from "@/app/db";
// Re-export from the shared (client-safe) file
export { MACHINE_ACTION_KEYS, type MachineActionKey } from "./machine-action-keys";
import type { MachineActionKey } from "./machine-action-keys";

type UserPayload = { id: string; role: string; [key: string]: any };

/**
 * Resolves the DicomNode ID by looking up its AE Title among ACTIVE nodes.
 *
 * If multiple active nodes share the same aeTitle, we return null and log a
 * warning — applying permissions to the wrong node is worse than skipping
 * machine-level enforcement. Admin must fix the duplicate.
 */
export async function resolveDicomNodeIdByAETitle(aeTitle: string | null | undefined): Promise<string | null> {
  if (!aeTitle) return null;
  const nodes = await prisma.dicomNode.findMany({
    where: { aeTitle, isActive: true },
    select: { id: true },
    take: 2,
  });
  if (nodes.length > 1) {
    console.warn(
      `[machine-permissions] Multiple ACTIVE DicomNodes share aeTitle="${aeTitle}". ` +
      `Cannot determine which node to enforce permissions on. Skipping machine-level check.`
    );
    return null;
  }
  return nodes[0]?.id || null;
}

/**
 * Checks if the given user is allowed to perform a specific action on a specific machine.
 * 
 * Logic:
 * 1. If user is ADMIN, allow immediately.
 * 2. If dicomNodeId IS provided, query the exact permission record.
 *    - If record exists and `allow === false`, DENY.
 *    - If record exists and `allow === true`, ALLOW.
 *    - If no record, fallback ALLOW (global permission still enforced by caller).
 * 3. If dicomNodeId is NOT provided (aeTitle empty/unresolvable), we ALLOW
 *    but log a warning so admins can investigate and backfill stationAeTitle.
 *    Rationale: blocking all operations on legacy studies with missing station
 *    is too disruptive. Matrix enforcement only kicks in when the system can
 *    positively identify which machine a study belongs to.
 */
export async function canPerformMachineAction(
  user: UserPayload | null,
  dicomNodeId: string | null,
  actionKey: MachineActionKey
): Promise<boolean> {
  if (!user) return false;
  
  // 1. System Admins can do anything
  if (user.role === "ADMIN") return true;

  // 2. Specific node — check exact permission
  if (dicomNodeId) {
    const perm = await prisma.doctorMachinePermission.findUnique({
      where: {
        doctorId_dicomNodeId_actionKey: {
          doctorId: user.id,
          dicomNodeId,
          actionKey,
        }
      }
    });
    if (perm) return perm.allow;
    // No explicit record for this node → fallback allow (global perm still checked by caller)
    return true;
  }

  // 3. No dicomNodeId — cannot enforce machine-level restrictions.
  //    Fallback allow; global permission (e.g. reports.write) is still enforced by the caller.
  //    Log a warning so admins can backfill stationAeTitle on orphan studies.
  console.warn(
    `[machine-permissions] Cannot enforce matrix for user=${user.id} action=${actionKey}: ` +
    `no dicomNodeId resolved (stationAeTitle missing or not matching any active node). Allowing by default.`
  );
  return true;
}
