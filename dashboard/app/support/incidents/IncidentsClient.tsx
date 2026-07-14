"use client";

import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

export function IncidentsClient({
  incidents,
  isAdmin,
  canReport,
}: {
  incidents: any[];
  isAdmin: boolean;
  canReport: boolean;
}) {

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <ScreenHeader />
          <p className="text-sm text-muted-foreground mt-1">
            Track operational issues and system incidents. {isAdmin ? "Managing all incidents." : "Viewing your reported incidents."}
          </p>
        </div>
        {(canReport || isAdmin) && (
          <Link href="/support/incidents/new">
            <span className="inline-flex items-center rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80">
              <Plus className="mr-2 h-4 w-4" /> Report Incident
            </span>
          </Link>
        )}
      </header>

      <div className="bg-card border rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-medium">Description</th>
              <th className="p-3 text-left font-medium">Status & Sev</th>
              <th className="p-3 text-left font-medium">Module</th>
              <th className="p-3 text-left font-medium">Reported By</th>
              <th className="p-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {incidents.map(inc => (
              <tr key={inc.id} className="hover:bg-muted/50">
                <td className="p-3 max-w-xs">
                  <div className="font-medium line-clamp-2" title={inc.shortDesc}>{inc.shortDesc}</div>
                  {inc.contextType && (
                    <div className="text-xs text-muted-foreground mt-1">Context: {inc.contextType} {inc.contextId && `(${inc.contextId})`}</div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inc.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      inc.status === 'CLOSED' ? 'bg-vin-shell text-vin-text2' :
                      inc.status === 'INVESTIGATING' ? 'bg-vin-accent/15 text-vin-accent' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    inc.severity === 'SEV1' ? 'bg-red-600 text-white' :
                    inc.severity === 'SEV2' ? 'bg-red-100 text-red-800' :
                    inc.severity === 'SEV3' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-vin-shell text-vin-text2'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-xs bg-muted px-2 py-1 rounded font-medium">{inc.module}</span>
                </td>
                <td className="p-3 text-muted-foreground">
                  <div>{inc.reportedByUser?.fullName || "System"}</div>
                  <div className="text-xs">{new Date(inc.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="p-3 text-right">
                  <Link href={`/support/incidents/${inc.id}`}>
                    <span className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold text-vin-accent hover:bg-vin-panel">
                      View <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
