import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { getHealthRunsAction } from './actions';
import { HealthRunClient } from './HealthRunClient';

export default async function SystemHealthPage() {
  const runs = await getHealthRunsAction(10);

  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-vin-text2 mb-8">
        Run diagnostic checks on database, storage, DICOM endpoints, and essential services.
      </p>

      <div className="mb-6">
        <HealthRunClient />
      </div>

      <div className="bg-vin-panel rounded-lg shadow border border-vin-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-vin-panel2 border-b border-vin-border">
              <th className="p-4 font-semibold text-vin-text2">Time</th>
              <th className="p-4 font-semibold text-vin-text2">Trigger</th>
              <th className="p-4 font-semibold text-vin-text2">Status</th>
              <th className="p-4 font-semibold text-vin-text2">Details</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-vin-muted">No health check runs found.</td>
              </tr>
            ) : (
              runs.map((run: any) => (
                <tr key={run.id} className="border-b border-vin-border">
                  <td className="p-4">
                    {new Date(run.startedAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {run.trigger} by {run.triggeredByUser?.username || 'System'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      run.status === 'OK' ? 'bg-green-100 text-green-800' :
                      run.status === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                      run.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                      'bg-vin-shell text-vin-text'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <ul className="list-disc list-inside">
                      {run.items?.map((item: any) => (
                        <li key={item.id} className="mb-1">
                          <strong>{item.category}/{item.checkKey}</strong>: {' '}
                          <span className={
                            item.status === 'OK' ? 'text-green-600' :
                            item.status === 'FAIL' ? 'text-red-600' :
                            item.status === 'WARN' ? 'text-yellow-600' :
                            'text-vin-muted'
                          }>{item.status}</span> - {item.message}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

