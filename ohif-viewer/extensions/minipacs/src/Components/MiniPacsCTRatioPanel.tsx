import React, { useState, useEffect } from 'react';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';

export function MiniPacsCTRatioPanel({ servicesManager }: { servicesManager: any }) {
  const [heartWidth, setHeartWidth] = useState<number | null>(null);
  const [thoracicWidth, setThoracicWidth] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [viewportId, setViewportId] = useState<string | null>(null);

  useEffect(() => {
    const { viewportGridService } = servicesManager.services;
    const activeViewportId = viewportGridService.getActiveViewportId();
    setViewportId(activeViewportId);

    // Initial audit log
    fetch('/api/audit/viewer-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studyInstanceUid: getMiniPacsViewportState(activeViewportId, servicesManager)?.StudyInstanceUID,
        action: 'specialty_measurement_started',
        metadata: { type: 'CTRatio' }
      })
    }).catch(() => {});
  }, [servicesManager]);

  const calculateRatio = () => {
    if (heartWidth && thoracicWidth) {
      return (heartWidth / thoracicWidth).toFixed(2);
    }
    return '--';
  };

  const handleSave = async () => {
    if (!heartWidth || !thoracicWidth) return;
    setStatus('saving');

    try {
      const state = getMiniPacsViewportState(viewportId, servicesManager);
      if (!state || !state.StudyInstanceUID) throw new Error('No active study');

      // Create measurement payload
      const measurementData = {
        type: 'CTRatio',
        heartWidth,
        thoracicWidth,
        ratio: Number(calculateRatio()),
        toolType: 'SpecialtyMeasurement'
      };

      const measurementUid = `ct-ratio-${Date.now()}`;
      
      const payload = {
        studyInstanceUid: state.StudyInstanceUID,
        seriesInstanceUid: state.SeriesInstanceUID,
        sopInstanceUid: state.SOPInstanceUID || '',
        toolName: 'CTRatio',
        measurementType: 'specialty',
        annotationUID: measurementUid,
        measurementUID: measurementUid,
        label: 'CTR',
        displayText: `CTR: ${calculateRatio()}`,
        value: Number(calculateRatio()),
        unit: 'ratio',
        data: measurementData,
      };

      const res = await fetch(`/api/viewer/studies/${state.StudyInstanceUID}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save');

      fetch('/api/audit/viewer-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyInstanceUid: state.StudyInstanceUID,
          action: 'specialty_measurement_saved',
          metadata: { type: 'CTRatio', ratio: calculateRatio() }
        })
      }).catch(() => {});

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <div className="w-[300px] p-4 bg-[#102126] text-[#E0E0E0] rounded shadow-lg border border-[#1A323A] font-sans">
      <h3 className="text-[#00B5B8] text-sm font-semibold mb-3 border-b border-[#1A323A] pb-1">Cardiothoracic Ratio</h3>
      <div className="mb-4 text-xs text-[#8899A6]">
        Use the Length tool to measure the max transverse cardiac diameter and the max inner thoracic diameter. Enter the values below to compute CTR.
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div>
          <label className="block text-xs mb-1">Max Cardiac Width (mm)</label>
          <input
            type="number"
            value={heartWidth || ''}
            onChange={(e) => setHeartWidth(Number(e.target.value))}
            className="w-full bg-[#0D1B20] border border-[#1A323A] rounded px-2 py-1 text-sm focus:border-[#00B5B8] outline-none"
            placeholder="e.g. 140"
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Max Thoracic Width (mm)</label>
          <input
            type="number"
            value={thoracicWidth || ''}
            onChange={(e) => setThoracicWidth(Number(e.target.value))}
            className="w-full bg-[#0D1B20] border border-[#1A323A] rounded px-2 py-1 text-sm focus:border-[#00B5B8] outline-none"
            placeholder="e.g. 300"
          />
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#0D1B20] p-2 rounded border border-[#1A323A] mb-4">
        <span className="text-xs font-semibold">Calculated CTR:</span>
        <span className={`text-sm font-bold ${calculateRatio() !== '--' && Number(calculateRatio()) > 0.5 ? 'text-[#ef4444]' : 'text-[#4ade80]'}`}>
          {calculateRatio()}
        </span>
      </div>

      <button
        disabled={!heartWidth || !thoracicWidth || status === 'saving'}
        onClick={handleSave}
        className="w-full bg-[#00B5B8] hover:bg-[#009699] text-white py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved!' : 'Save Measurement'}
      </button>

      {status === 'error' && (
        <div className="mt-2 text-[#ef4444] text-xs text-center">Failed to save measurement.</div>
      )}
    </div>
  );
}
