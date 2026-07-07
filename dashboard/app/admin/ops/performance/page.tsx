import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { getPerformanceRunsAction } from './actions';
import { PerformanceRunClient } from './PerformanceRunClient';

export default async function PerformanceCenterPage() {
  const runs = await getPerformanceRunsAction(10);

  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-gray-600 mb-8">
        Run bounded performance smoke tests to verify system responsiveness. These tests are strictly limited to prevent impacting production performance.
      </p>

      <div className="mb-6">
        <PerformanceRunClient />
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-700">Time</th>
              <th className="p-4 font-semibold text-gray-700">Test</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700">Duration</th>
              <th className="p-4 font-semibold text-gray-700">Results</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No performance runs found.</td>
              </tr>
            ) : (
              runs.map((run: any) => (
                <tr key={run.id} className="border-b border-gray-200">
                  <td className="p-4">
                    {new Date(run.createdAt).toLocaleString()}
                    <br />
                    <span className="text-xs text-gray-500">by {run.triggeredByUser?.username || 'Unknown'}</span>
                  </td>
                  <td className="p-4 font-mono text-sm">{run.testKey}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      run.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      run.status === 'SKIPPED' ? 'bg-gray-100 text-gray-800' :
                      run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {run.durationMs != null ? `${run.durationMs} ms` : '-'}
                  </td>
                  <td className="p-4 text-sm max-w-md break-words">
                    {run.status === 'FAILED' ? (
                      <span className="text-red-600">{run.errorMessage}</span>
                    ) : (
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {run.resultJson ? JSON.stringify(JSON.parse(run.resultJson), null, 2) : '-'}
                      </pre>
                    )}
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

