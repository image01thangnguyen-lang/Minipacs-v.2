import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createReleaseCandidate } from "../actions";

export default async function NewReleasePage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    redirect("/login");
  }
  if (!hasPermission(user.role, "release.manage", user.permissions)) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <header className="flex flex-col gap-4">
        <Link href="/admin/release/go-live" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Go-Live Command Center
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Release Candidate</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Initiate a new release workflow. This will track all UAT, health checks, and sign-offs for this version.
          </p>
        </div>
      </header>

      <form 
        action={async (formData) => {
          "use server";
          const id = await createReleaseCandidate(formData);
          redirect(`/admin/release/go-live/${id}`);
        }} 
        className="bg-card border rounded-xl shadow p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Target Version</label>
          <input 
            name="version"
            type="text"
            required
            placeholder="e.g., v2.1.0-rc.1"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Release Notes / Scope</label>
          <textarea 
            name="notes"
            required
            placeholder="Describe the main features or fixes in this release..."
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full rounded bg-vin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80"
          >
            Create Release Candidate
          </button>
        </div>
      </form>
    </div>
  );
}
