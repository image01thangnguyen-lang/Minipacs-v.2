import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { prisma } from '@/app/db';
import { getDicomRunsAction } from './actions';
import { DicomRunClient } from './DicomRunClient';

export default async function DicomConformancePage() {
  const runs = await getDicomRunsAction(20);
  const nodes = await prisma.dicomNode.findMany({ select: { id: true, name: true } });

  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-vin-text2 mb-8">
        Run standard DICOM tests like C-ECHO and basic WADO/QIDO availability.
      </p>

      <div className="mb-6">
        <DicomRunClient nodes={nodes} />
      </div>

      <div className="bg-vin-panel rounded-lg shadow border border-vin-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-vin-panel2 border-b border-vin-border">
              <th className="p-4 font-semibold text-vin-text2">Time</th>
              <th className="p-4 font-semibold text-vin-text2">Target Node</th>
              <th className="p-4 font-semibold text-vin-text2">Status</th>
              <th className="p-4 font-semibold text-vin-text2">Test Items</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-vin-muted">No DICOM tests run yet.</td>
              </tr>
            ) : (
              runs.map((run: any) => (
                <tr key={run.id} className="border-b border-vin-border">
                  <td className="p-4 align-top">
                    {new Date(run.createdAt).toLocaleString()}
                    <br />
                    <span className="text-sm text-vin-muted">by {run.triggeredByUser?.username || 'System'}</span>
                  </td>
                  <td className="p-4 align-top">
                    {run.dicomNode ? run.dicomNode.name : <span className="italic text-vin-faint">Generic</span>}
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      run.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      run.status === 'SKIPPED' ? 'bg-vin-shell text-vin-text' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4 align-top text-sm">
                    <ul className="list-disc list-inside space-y-1">
                      {run.items?.map((item: any) => (
                        <li key={item.id}>
                          <strong>{item.stepKey}</strong>: {' '}
                          <span className={
                            item.status === 'SUCCESS' ? 'text-green-600' :
                            item.status === 'FAILED' ? 'text-red-600' :
                            'text-vin-muted'
                          }>{item.status}</span>
                          <span className="text-vin-muted ml-2">({item.message})</span>
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


