"use server";

import { prisma } from "@/app/db";
import { requirePermission } from "@/lib/authz";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { GO_LIVE_SIGNOFF_ROLES } from "./constants";

const FRESH_CHECK_MS = 24 * 60 * 60 * 1000;

function isFresh(date?: Date | null) {
  return !!date && Date.now() - date.getTime() <= FRESH_CHECK_MS;
}

function latestCheckStatus(
  run: { status: string; startedAt?: Date | null; finishedAt?: Date | null; createdAt?: Date | null } | null,
  passingStatuses: string[],
) {
  const checkedAt = run?.finishedAt || run?.createdAt || run?.startedAt || null;
  const stale = !isFresh(checkedAt);
  return {
    status: run?.status || "MISSING",
    checkedAt,
    stale,
    ok: !!run && !stale && passingStatuses.includes(run.status),
  };
}

export async function getReleaseReadiness() {
  const [
    latestHealth,
    latestSecurity,
    latestPerformance,
    latestDicom,
    latestUat,
    incidentBlockers,
    securityBlockers,
  ] = await Promise.all([
    prisma.systemHealthCheckRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.securityAuditRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.performanceTestRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.dicomConformanceRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.uatRun.findFirst({
      orderBy: { startedAt: "desc" },
      include: { results: { select: { status: true } } },
    }),
    prisma.incidentTicket.count({
      where: {
        status: { in: ["OPEN", "INVESTIGATING"] },
        severity: { in: ["SEV1", "SEV2"] },
      },
    }),
    prisma.securityAuditFinding.count({
      where: {
        severity: { in: ["P0", "P1"] },
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    }),
  ]);

  const uatFailureCount = latestUat?.results.filter(result =>
    result.status === "FAIL" || result.status === "BLOCKED"
  ).length || 0;
  const uatPendingCount = latestUat?.results.filter(result => result.status === "PENDING").length || 0;

  const checks = {
    health: latestCheckStatus(latestHealth, ["OK"]),
    security: latestCheckStatus(latestSecurity, ["OK"]),
    performance: latestCheckStatus(latestPerformance, ["SUCCESS", "SKIPPED"]),
    dicom: latestCheckStatus(latestDicom, ["SUCCESS", "SKIPPED"]),
  };

  const blockers = {
    incidents: incidentBlockers,
    securityFindings: securityBlockers,
    uatFailures: uatFailureCount,
    uatPending: uatPendingCount,
    uatMissing: latestUat ? 0 : 1,
    staleChecks: Object.values(checks).filter(check => check.stale || !check.ok).length,
  };

  return {
    checks,
    latestUat,
    blockers,
    ready: Object.values(blockers).every(count => count === 0),
  };
}

export async function createReleaseCandidate(formData: FormData) {
  const user = await requirePermission("release.manage");

  const version = String(formData.get("version") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!version) throw new Error("Version is required");

  const rc = await prisma.releaseCandidate.create({
    data: {
      version,
      notes,
      status: "DRAFT",
      createdByUserId: user.id
    }
  });

  revalidatePath("/admin/release/go-live");
  return rc.id;
}

export async function signOffRelease(releaseId: string, role: string, status: "APPROVED" | "REJECTED", notes: string) {
  const user = await requirePermission("release.signoff");

  if (!GO_LIVE_SIGNOFF_ROLES.includes(role as any)) {
    throw new Error("Invalid sign-off role");
  }

  const release = await prisma.releaseCandidate.findUnique({ where: { id: releaseId } });
  if (!release || release.status === "RELEASED" || release.status === "ROLLED_BACK") {
    throw new Error("Release is not open for sign-off");
  }

  if (status === "APPROVED") {
    const readiness = await getReleaseReadiness();
    if (!readiness.ready && !hasPermission(user.role, "release.manage", user.permissions)) {
      throw new Error("Cannot sign off while go-live blockers are open.");
    }
  }

  await prisma.releaseSignOff.upsert({
    where: {
      releaseId_role: { releaseId, role }
    },
    update: {
      status,
      notes,
      signedByUserId: user.id,
      signedAt: new Date()
    },
    create: {
      releaseId,
      role,
      status,
      notes,
      signedByUserId: user.id,
      signedAt: new Date()
    }
  });

  // Check if all signoffs are done to move status to READY_FOR_SIGNOFF or APPROVED
  // Simplified logic: Just keep it in DRAFT/TESTING until manually promoted.

  revalidatePath(`/admin/release/go-live`);
  revalidatePath(`/admin/release/go-live/${releaseId}`);
}

export async function transitionRelease(releaseId: string, newStatus: string) {
  await requirePermission("release.manage");

  const allowedStatuses = ["TESTING", "BLOCKED", "READY_FOR_SIGNOFF", "APPROVED", "RELEASED", "ROLLED_BACK"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Invalid release status transition");
  }

  const release = await prisma.releaseCandidate.findUnique({
    where: { id: releaseId },
    include: { signOffs: true },
  });
  if (!release) {
    throw new Error("Release not found");
  }
  if (release.status === "ROLLED_BACK") {
    throw new Error("Rolled back releases cannot be transitioned");
  }

  const data: any = { status: newStatus };
  if (newStatus === "RELEASED") {
    const approvedRoles = new Set(
      release.signOffs
        .filter(signOff => signOff.status === "APPROVED")
        .map(signOff => signOff.role)
    );
    const allApproved = GO_LIVE_SIGNOFF_ROLES.every(role => approvedRoles.has(role));
    if (!allApproved) {
      throw new Error("All go-live roles must approve before release.");
    }

    const readiness = await getReleaseReadiness();
    if (!readiness.ready) {
      throw new Error("Release cannot go live while readiness blockers are open.");
    }

    data.releasedAt = new Date();
  }

  await prisma.releaseCandidate.update({
    where: { id: releaseId },
    data
  });

  revalidatePath(`/admin/release/go-live`);
  revalidatePath(`/admin/release/go-live/${releaseId}`);
}
