export const dynamic = 'force-dynamic';
import React from 'react';
import { getHealthRunsAction } from './actions';
import { HealthRunClient } from './HealthRunClient';

export default async function SystemHealthPage() {
  const runs = await getHealthRunsAction(10);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Health Center</h1>
      <p className="text-gray-600 mb-8">
        Run diagnostic checks on database, storage, DICOM endpoints, and essential services.
      </p>

      <div className="mb-6">
        <HealthRunClient />
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-700">Time</th>
              <th className="p-4 font-semibold text-gray-700">Trigger</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700">Details</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">No health check runs found.</td>
              </tr>
            ) : (
              runs.map((run: any) => (
                <tr key={run.id} className="border-b border-gray-200">
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
                      'bg-gray-100 text-gray-800'
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
                            'text-gray-500'
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

