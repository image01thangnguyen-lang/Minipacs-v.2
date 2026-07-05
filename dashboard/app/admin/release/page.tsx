import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Release Center | MiniPACS",
  description: "Manage release candidates, sign-offs, and operational handoff.",
};

export default function ReleaseCenterPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Release Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage release candidates, UAT, and sign-offs for production go-live.
          </p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Active Releases</h3>
            <p className="text-sm text-muted-foreground">Currently testing or preparing for go-live</p>
          </div>
          <div className="p-6 pt-0 text-2xl font-bold">0</div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col justify-between">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">User Acceptance Testing (UAT)</h3>
            <p className="text-sm text-muted-foreground">Manage test suites, cases, and view UAT results</p>
          </div>
          <div className="p-6 pt-0 mt-auto">
            <Link 
              href="/admin/release/uat"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Go to UAT Center <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
