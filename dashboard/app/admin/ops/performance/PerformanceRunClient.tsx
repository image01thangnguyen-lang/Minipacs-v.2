'use client'

import React, { useState } from 'react';
import { runPerformanceSmokeAction } from './actions';

export function PerformanceRunClient() {
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      await runPerformanceSmokeAction();
    } catch (err: any) {
      alert(`Error running performance test: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRun}
      disabled={loading}
      className={`px-4 py-2 rounded font-semibold text-white ${loading ? 'bg-yellow-300' : 'bg-yellow-600 hover:bg-yellow-700'}`}
    >
      {loading ? 'Running...' : 'Run Performance Smoke Test'}
    </button>
  );
}
