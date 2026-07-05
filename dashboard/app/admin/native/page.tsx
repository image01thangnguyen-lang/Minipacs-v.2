export const dynamic = 'force-dynamic';
import React from 'react';
import { getNativeConfig, getNativeEvents } from '@/lib/services/nativeConnectorService';
import { NativeConfigClient } from './NativeConfigClient';

export default async function NativeCompanionPage() {
  const config = await getNativeConfig();
  const events = await getNativeEvents(50);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Native Workstation Companion</h1>
      <p className="text-gray-600 mb-8">
        Manage the bridge between the web dashboard and local native workstation tools (e.g., advanced 3D rendering, local disk storage).
        <strong> Disabled by default for security.</strong>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <NativeConfigClient initialConfig={config} />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold">
              Recent Bridge Events
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
              {events.length === 0 ? (
                <p className="text-gray-500 text-center">No companion events logged.</p>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2">Time</th>
                      <th className="py-2">User</th>
                      <th className="py-2">Event</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt: any) => (
                      <tr key={evt.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-500">{new Date(evt.createdAt).toLocaleString()}</td>
                        <td className="py-2">{evt.actorUser?.username || 'System'}</td>
                        <td className="py-2 font-mono text-xs">{evt.actionKey}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            evt.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


