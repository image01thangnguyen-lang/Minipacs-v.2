import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { auth } from "@/auth";
import { prisma } from "@/app/db";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { CheckCircle, AlertCircle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { attestTraining } from "./actions";
import TrainingAdminPanel from "./TrainingAdminPanel";

export default async function TrainingCenterPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }

  const isAdmin = hasPermission(user.role, "training.manage", user.permissions);
  const canRead = hasPermission(user.role, "training.read", user.permissions) || isAdmin;
  const canAttest = hasPermission(user.role, "training.attest", user.permissions) || isAdmin;
  if (!canRead) {
    redirect("/");
  }

  // For regular users (or even admins viewing their own training), fetch their assigned training.
  const myAssignments = await prisma.trainingAssignment.findMany({
    where: { userId: user.id },
    include: { material: true },
    orderBy: { createdAt: "desc" }
  });

  const pendingCount = myAssignments.filter(a => a.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <header>
        <ScreenHeader />
        <p className="text-sm text-muted-foreground mt-1">
          Access training materials, verify compliance, and sign off on completion.
        </p>
      </header>

      {/* User's Own Training Panel */}
      <div className="bg-card border rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center">
            My Training Requirements
            {pendingCount > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-bold">
                {pendingCount} Pending
              </span>
            )}
          </h2>
        </div>

        {myAssignments.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            You currently have no training assigned to you.
          </div>
        ) : (
          <div className="divide-y">
            {myAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${assignment.status === 'COMPLETED' ? 'text-green-500' : 'text-orange-500'}`}>
                    {assignment.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {assignment.material.title}
                      {assignment.material.isRequired && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm">Required</span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{assignment.material.description}</p>
                    {assignment.material.url && (
                      <a href={assignment.material.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline mt-2">
                        <FileText className="w-4 h-4 mr-1" /> View Material
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  {assignment.status === 'COMPLETED' ? (
                    <div className="text-sm text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-md border border-green-200">
                      Completed on {assignment.attestedAt ? new Date(assignment.attestedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  ) : (
                    <form action={async () => {
                      "use server";
                      await attestTraining(assignment.id);
                    }}>
                      <button
                        type="submit"
                        className="rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canAttest}
                      >
                        Mark as Completed
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <TrainingAdminPanel />
      )}
    </div>
  );
}
