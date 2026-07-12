'use client'

import React, { useState } from 'react';
import { runSecurityAuditAction, resolveSecurityFindingAction } from './actions';

export function SecurityRunClient() {
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      await runSecurityAuditAction();
    } catch (err: any) {
      alert(`Error running security audit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      className={`px-4 py-2 rounded font-semibold text-white ${loading ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
    >
      {loading ? 'Running...' : 'Run Security Audit'}
    </button>
  );
}

export function SecurityResolveClient({ findingId, currentStatus }: { findingId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  if (currentStatus === 'FIXED' || currentStatus === 'ACCEPTED_RISK') {
    return <span className="text-sm text-vin-muted">Resolved ({currentStatus})</span>;
  }

  const handleResolve = async (action: 'FIXED' | 'ACCEPTED_RISK') => {
    setLoading(true);
    try {
      await resolveSecurityFindingAction(findingId, action);
    } catch (err: any) {
      alert(`Error resolving finding: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handleResolve('FIXED')}
        disabled={loading}
        className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
      >
        Mark Fixed
      </button>
      <button
        onClick={() => handleResolve('ACCEPTED_RISK')}
        disabled={loading}
        className="px-2 py-1 bg-vin-shell text-vin-text text-sm rounded hover:bg-vin-tableHover"
      >
        Accept Risk
      </button>
    </div>
  );
}
