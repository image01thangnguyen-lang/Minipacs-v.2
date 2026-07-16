import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createUatRun } from "./actions";

export default async function UatCenterPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const canRead = hasPermission(user.role, "uat.read", user.permissions) || hasPermission(user.role, "uat.manage", user.permissions);
  const canStartRun = hasPermission(user.role, "uat.execute", user.permissions) || hasPermission(user.role, "uat.manage", user.permissions);
  if (!canRead) {
    redirect("/");
  }

  const suites = await prisma.uatSuite.findMany({
    include: {
      cases: true,
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: {
          testedByUser: true
        }
      }
    }
  });

  const recentRuns = await prisma.uatRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
    include: {
      suite: true,
      testedByUser: true,
      results: true,
    }
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <ScreenHeader />
          <p className="text-sm text-muted-foreground mt-1">
            Manage and execute User Acceptance Testing suites.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Suites</h2>
          {suites.map(suite => (
            <div key={suite.id} className="rounded-xl border bg-card text-card-foreground shadow p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{suite.name} (v{suite.version})</h3>
                  <p className="text-sm text-muted-foreground">{suite.description}</p>
                </div>
                <div className="text-sm bg-muted px-2 py-1 rounded">
                  {suite.cases.length} cases
                </div>
              </div>
              {suite.runs[0] && (
                <div className="text-sm text-muted-foreground">
                  Last run: {new Date(suite.runs[0].startedAt).toLocaleDateString()} by {suite.runs[0].testedByUser?.fullName || "Unknown"}
                  {" - "}<span className="font-medium">{suite.runs[0].status}</span>
                </div>
              )}
              <div className="flex justify-end pt-2">
                {canStartRun && (
                  <form action={async () => {
                    "use server";
                    const runId = await createUatRun(suite.id);
                    redirect(`/admin/release/uat/runs/${runId}`);
                  }}>
                    <button
                      type="submit"
                      className="rounded bg-vin-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-vin-accent/80"
                    >
                      Start New Run
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {suites.length === 0 && (
            <p className="text-sm text-muted-foreground">No test suites available. Run the DB seeder to generate baseline cases.</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Runs</h2>
          <div className="rounded-xl border shadow bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Suite</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Progress</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentRuns.map(run => {
                  const total = run.results.length;
                  const completed = run.results.filter(r => r.status !== 'PENDING').length;
                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <tr key={run.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{run.suite.name}</div>
                        <div className="text-sm text-muted-foreground">{run.testedByUser?.fullName}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          run.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          run.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {run.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-secondary h-2 rounded overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{completed}/{total}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(run.startedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/admin/release/uat/runs/${run.id}`}>
                          <span className="inline-flex rounded px-2 py-1 text-sm font-semibold text-vin-accent hover:bg-vin-panel">
                            {run.status === 'IN_PROGRESS' ? 'Resume' : 'View'}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {recentRuns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No UAT runs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
