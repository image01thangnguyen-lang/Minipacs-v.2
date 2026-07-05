'use client'

import React, { useState } from 'react';
import { runDicomConformanceAction } from './actions';

export function DicomRunClient({ nodes }: { nodes: { id: string, name: string }[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('');

  const handleRun = async () => {
    setLoading(true);
    try {
      await runDicomConformanceAction(selectedNode || undefined);
    } catch (err: any) {
      alert(`Error running DICOM test: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <select 
        value={selectedNode}
        onChange={(e) => setSelectedNode(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm"
        disabled={loading}
      >
        <option value="">General Test (No specific node)</option>
        {nodes.map(node => (
          <option key={node.id} value={node.id}>{node.name}</option>
        ))}
      </select>
      <button 
        onClick={handleRun}
        disabled={loading}
        className={`px-4 py-2 rounded font-semibold text-white ${loading ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {loading ? 'Running...' : 'Run Conformance Test'}
      </button>
    </div>
  );
}
