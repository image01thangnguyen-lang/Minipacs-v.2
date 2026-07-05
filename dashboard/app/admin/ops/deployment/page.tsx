export const dynamic = 'force-dynamic';
import React from 'react';
import { getDeploymentReadinessAction } from './actions';

export default async function DeploymentReadinessPage() {
  const readiness = await getDeploymentReadinessAction();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deployment Readiness</h1>
      <p className="text-gray-600 mb-8">
        Review the current configuration and connection status of core dependencies.
      </p>

      <div className="space-y-6">
        {readiness.map((categoryGroup: any, idx: number) => (
          <div key={idx} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700">
              {categoryGroup.category}
            </div>
            <ul className="divide-y divide-gray-200">
              {categoryGroup.items.map((item: any, i: number) => (
                <li key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-4 text-sm text-gray-500">{item.message}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${
                    item.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

