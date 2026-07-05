import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import UatRunForm from "./UatRunForm";

export default async function UatRunPage({ params }: { params: { runId: string } }) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const canRead = hasPermission(user.role, "uat.read", user.permissions) || hasPermission(user.role, "uat.manage", user.permissions);
  if (!canRead) {
    redirect("/");
  }

  const run = await prisma.uatRun.findUnique({
    where: { id: params.runId },
    include: {
      suite: true,
      testedByUser: true,
      results: {
        include: {
          caseRef: true,
          evidences: true,
        },
        orderBy: { caseId: "asc" },
      }
    }
  });

  if (!run) {
    notFound();
  }

  const canManage = hasPermission(user.role, "uat.manage", user.permissions);
  const canExecute = run.status === "IN_PROGRESS" && (
    canManage || (
      hasPermission(user.role, "uat.execute", user.permissions) &&
      user.id === run.testedByUserId
    )
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/admin/release/uat" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to UAT Center
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Run: {run.suite.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tested by {run.testedByUser?.fullName} • Status: <span className="font-medium">{run.status}</span>
            </p>
          </div>
          <div>
            {run.status === "IN_PROGRESS" && !canExecute && (
              <div className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> You cannot execute this run because it is assigned to someone else.
              </div>
            )}
          </div>
        </div>
      </header>

      <UatRunForm run={run} canExecute={canExecute} />
    </div>
  );
}
