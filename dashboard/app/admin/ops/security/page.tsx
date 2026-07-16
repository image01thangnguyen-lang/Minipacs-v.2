import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { getSecurityFindingsAction, getScrubbedAuditLogsAction } from './actions';
import { SecurityRunClient, SecurityResolveClient } from './SecurityRunClient';

export default async function SecurityCenterPage() {
  const findings = await getSecurityFindingsAction(50);
  const auditLogs = await getScrubbedAuditLogsAction(50);

  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-vin-text2 mb-8">
        Run security audits, review findings, and browse scrubbed system audit logs.
      </p>

      <div className="mb-6">
        <SecurityRunClient />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-vin-panel rounded-lg shadow border border-vin-border overflow-hidden">
          <div className="p-4 bg-vin-panel2 border-b border-vin-border font-semibold">
            Recent Security Findings
          </div>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
            {findings.length === 0 ? (
              <p className="text-vin-muted text-center">No findings.</p>
            ) : (
              <ul className="space-y-4">
                {findings.map((finding: any) => (
                  <li key={finding.id} className="border border-vin-border p-4 rounded bg-vin-panel2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{finding.title}</h3>
                      <span className={`px-2 py-1 rounded text-sm font-bold ${finding.severity === 'P0' || finding.severity === 'P1' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-vin-text2 mb-2">{finding.description}</p>
                    <p className="text-sm text-vin-muted mb-4"><strong>Recommendation:</strong> {finding.recommendation}</p>
                    <div className="flex justify-between items-center border-t border-vin-border pt-3">
                      <span className="text-sm text-vin-muted">Status: {finding.status}</span>
                      <SecurityResolveClient findingId={finding.id} currentStatus={finding.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-vin-panel rounded-lg shadow border border-vin-border overflow-hidden">
          <div className="p-4 bg-vin-panel2 border-b border-vin-border font-semibold">
            System Audit Explorer (Scrubbed)
          </div>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
            {auditLogs.length === 0 ? (
              <p className="text-vin-muted text-center">No logs.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-vin-border">
                    <th className="py-2">Time</th>
                    <th className="py-2">User</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-vin-border">
                      <td className="py-2 text-vin-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2">{log.user?.username || 'Unknown'}</td>
                      <td className="py-2 font-mono text-sm bg-vin-shell p-1 rounded">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

