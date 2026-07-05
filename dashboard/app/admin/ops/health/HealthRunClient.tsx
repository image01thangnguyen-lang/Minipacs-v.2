'use client'

import React, { useState } from 'react';
import { runSystemHealthCheckAction } from './actions';

export function HealthRunClient() {
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      await runSystemHealthCheckAction();
    } catch (err: any) {
      alert(`Error running health check: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRun}
      disabled={loading}
      className={`px-4 py-2 rounded font-semibold text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {loading ? 'Running...' : 'Run Health Check Now'}
    </button>
  );
}
