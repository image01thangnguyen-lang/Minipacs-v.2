import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
export const dynamic = 'force-dynamic';
import React from 'react';
import { getDeploymentReadinessAction } from './actions';

export default async function DeploymentReadinessPage() {
  const readiness = await getDeploymentReadinessAction();

  return (
    <div className="p-6">
      <ScreenHeader />
      <p className="text-vin-text2 mb-8">
        Review the current configuration and connection status of core dependencies.
      </p>

      <div className="space-y-6">
        {readiness.map((categoryGroup: any, idx: number) => (
          <div key={idx} className="bg-vin-panel rounded-lg shadow border border-vin-border overflow-hidden">
            <div className="bg-vin-panel2 px-4 py-3 border-b border-vin-border font-semibold text-vin-text2">
              {categoryGroup.category}
            </div>
            <ul className="divide-y divide-gray-200">
              {categoryGroup.items.map((item: any, i: number) => (
                <li key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-4 text-sm text-vin-muted">{item.message}</span>
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

