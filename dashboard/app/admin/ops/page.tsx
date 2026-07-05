export const dynamic = 'force-dynamic';
import React from 'react';
import Link from 'next/link';

export default function OperationsCommandCenterPage() {
  const cards = [
    {
      title: 'System Health',
      description: 'Run and view system health checks',
      href: '/admin/ops/health',
      icon: '🏥',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Security & Audit',
      description: 'View security findings and system audits',
      href: '/admin/ops/security',
      icon: '🛡️',
      color: 'bg-red-100 text-red-800'
    },
    {
      title: 'Performance Smoke',
      description: 'Run performance and load smoke tests',
      href: '/admin/ops/performance',
      icon: '⚡',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      title: 'DICOM Conformance',
      description: 'Test DICOM nodes and standard conformance',
      href: '/admin/ops/dicom',
      icon: '📡',
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Deployment Readiness',
      description: 'Check environment, DB, and volume readiness',
      href: '/admin/ops/deployment',
      icon: '🚀',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Operations Command Center</h1>
      <p className="text-gray-600 mb-8">
        Welcome to the central operations hub. Monitor health, security, performance, and readiness of the PACS system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link href={card.href} key={card.href} className="block group">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white h-full">
              <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-2xl mb-4 ${card.color}`}>
                {card.icon}
              </div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                {card.title}
              </h2>
              <p className="text-gray-600">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

