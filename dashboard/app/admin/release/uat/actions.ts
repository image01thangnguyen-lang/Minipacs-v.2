"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

type UatResultStatus = "PENDING" | "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";

async function requireAnyPermission(permissions: PermissionKey[]) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const allowed = permissions.some(permission =>
    hasPermission(user.role, permission, user.permissions)
  );
  if (!allowed) {
    throw new Error("Unauthorized");
  }

  return user;
}

function userCanManageUat(user: Awaited<ReturnType<typeof requireAnyPermission>>) {
  return hasPermission(user.role, "uat.manage", user.permissions);
}

function assertCanMutateRun(
  user: Awaited<ReturnType<typeof requireAnyPermission>>,
  run: { testedByUserId: string | null; status: string },
) {
  if (run.status !== "IN_PROGRESS") {
    throw new Error("Run is not in progress or does not exist");
  }

  if (userCanManageUat(user)) {
    return;
  }

  if (run.testedByUserId !== user.id) {
    throw new Error("This UAT run is assigned to another tester");
  }
}

function parseEvidenceLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Evidence link is required");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Evidence must be a valid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Evidence URL must use http or https");
  }

  return {
    url: url.toString(),
    fileName: url.pathname.split("/").filter(Boolean).pop() || url.hostname,
  };
}

export async function createUatRun(suiteId: string) {
  const user = await requireAnyPermission(["uat.execute", "uat.manage"]);

  if (!suiteId) {
    throw new Error("Missing required fields");
  }

  const run = await prisma.$transaction(async tx => {
    const suite = await tx.uatSuite.findUnique({
      where: { id: suiteId },
      include: { cases: { select: { id: true } } },
    });
    if (!suite || !suite.isActive) {
      throw new Error("UAT suite is not available");
    }
    if (suite.cases.length === 0) {
      throw new Error("UAT suite has no cases");
    }

    const createdRun = await tx.uatRun.create({
      data: {
        suiteId,
        testedByUserId: user.id,
        status: "IN_PROGRESS",
      },
    });

    await tx.uatResult.createMany({
      data: suite.cases.map(testCase => ({
        runId: createdRun.id,
        caseId: testCase.id,
        status: "PENDING",
      })),
    });

    return createdRun;
  });

  revalidatePath("/admin/release/uat");
  return run.id;
}

export async function updateUatResult(runId: string, caseId: string, status: Exclude<UatResultStatus, "PENDING">, notes: string) {
  const user = await requireAnyPermission(["uat.execute", "uat.manage"]);

  const run = await prisma.uatRun.findUnique({
    where: { id: runId },
    include: {
      results: { where: { caseId }, select: { id: true } },
    },
  });
  if (!run || run.results.length === 0) {
    throw new Error("UAT result does not exist");
  }
  assertCanMutateRun(user, run);

  await prisma.uatResult.update({
    where: {
      runId_caseId: { runId, caseId }
    },
    data: {
      status,
      notes,
      testedAt: new Date()
    }
  });

  revalidatePath(`/admin/release/uat/runs/${runId}`);
}

export async function finishUatRun(runId: string, isApproved: boolean) {
  const user = await requireAnyPermission(["uat.execute", "uat.manage"]);

  const run = await prisma.uatRun.findUnique({
    where: { id: runId },
    include: { results: { select: { status: true } } },
  });
  if (!run) {
    throw new Error("Run is not in progress or does not exist");
  }
  assertCanMutateRun(user, run);

  if (isApproved) {
    if (run.results.some(result => result.status === "PENDING")) {
      throw new Error("Cannot approve a UAT run while cases are still pending");
    }
    if (run.results.some(result => result.status === "FAIL" || result.status === "BLOCKED")) {
      throw new Error("Cannot approve a UAT run with failed or blocked cases");
    }
  }

  await prisma.uatRun.update({
    where: { id: runId },
    data: {
      status: isApproved ? "COMPLETED" : "ABORTED",
      completedAt: new Date(),
    }
  });

  revalidatePath(`/admin/release/uat`);
  revalidatePath(`/admin/release/uat/runs/${runId}`);
}

export async function addUatEvidence(resultId: string, urlOrText: string, isScrubbed: boolean) {
  const user = await requireAnyPermission(["uat.execute", "uat.manage"]);

  if (!isScrubbed) {
    throw new Error("Evidence must be scrubbed of PHI before uploading.");
  }

  const evidence = parseEvidenceLink(urlOrText);

  const result = await prisma.uatResult.findUnique({
    where: { id: resultId },
    include: { run: true }
  });

  if (!result) {
    throw new Error("UAT result does not exist");
  }
  assertCanMutateRun(user, result.run);

  await prisma.uatEvidence.create({
    data: {
      resultId,
      evidenceKind: "LINK",
      fileUrl: evidence.url,
      fileName: evidence.fileName,
      fileType: "text/uri-list",
      fileSizeBytes: 0,
      isScrubbed,
      containsPhiRisk: false, // User attested it is scrubbed
      uploadedByUserId: user.id
    }
  });

  revalidatePath(`/admin/release/uat/runs/${result.runId}`);
}
