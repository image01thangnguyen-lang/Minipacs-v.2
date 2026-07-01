import React, { useState, useEffect } from 'react';
import { viewerDiagnosticsService, ViewerDiagnosticsResponse } from '../services/viewerDiagnosticsService';
import { getMiniPacsViewportState } from '../services/viewportStateAdapter';
import { commandFeedbackService } from '../services/commandFeedbackService';

export const MiniPacsDiagnosticsDialog = ({ servicesManager, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ViewerDiagnosticsResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studyInstanceUid, setStudyInstanceUid] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = async (e: CustomEvent) => {
      if (e.detail?.dialogId === 'diagnostics') {
        setIsOpen(true);
        setIsLoading(true);
        
        // Get current study if available
        const state = getMiniPacsViewportState(
          servicesManager.services.viewportGridService.getActiveViewportId(),
          servicesManager
        );
        if (state?.StudyInstanceUID) {
          setStudyInstanceUid(state.StudyInstanceUID);
        }

        const { data, error } = await viewerDiagnosticsService.getDiagnostics();
        if (data) {
          setDiagnostics(data);
          setErrorMsg(null);
        } else {
          setErrorMsg(error || 'Khong the tai thong tin Diagnostics');
          commandFeedbackService.show(error || 'Khong the tai thong tin Diagnostics', 'error');
        }
        setIsLoading(false);
      }
    };
    
    window.addEventListener('minipacs:open-dialog', handleOpen as EventListener);
    return () => window.removeEventListener('minipacs:open-dialog', handleOpen as EventListener);
  }, [servicesManager]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!diagnostics) return;
    const reportText = JSON.stringify({
      timestamp: diagnostics.timestamp,
      studyUid: studyInstanceUid || 'N/A',
      auth: diagnostics.services.auth.ok,
      database: diagnostics.services.database.ok,
      dicomweb: diagnostics.services.dicomweb.ok,
      reportWorkspace: diagnostics.services.reportWorkspace.ok,
      warnings: diagnostics.warnings,
      userAgent: navigator.userAgent
    }, null, 2);
    
    navigator.clipboard.writeText(reportText).then(() => {
      commandFeedbackService.show('Da copy vao clipboard', 'success');
    });
  };

  const renderStatus = (ok: boolean) => {
    return ok 
      ? <span className="text-green-400 font-medium">OK</span> 
      : <span className="text-red-400 font-medium">Fail</span>;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#102126] border border-[#1A323A] rounded shadow-2xl flex flex-col w-[500px] max-h-[80vh]">
        <div className="p-4 border-b border-[#1A323A] flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">He thong / Diagnostics</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#8899A6] hover:text-white">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-[#8899A6]">Dang tai...</div>
          ) : errorMsg ? (
            <div className="text-red-400 bg-red-900/20 border border-red-800 rounded p-3 text-sm">
              <span className="font-semibold block mb-1">Loi API:</span>
              {errorMsg}
            </div>
          ) : !diagnostics ? (
            <div className="text-red-400">Khong the ket noi den Backend API.</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#0D1B20] border border-[#1A323A] rounded p-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">Trang thai tong the:</span>
                  {renderStatus(diagnostics.ok)}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">Thoi gian he thong:</span>
                  <span className="text-white">{new Date(diagnostics.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-[#1A323A] mt-2 pt-2">
                  <span className="text-[#8899A6]">Study hien tai:</span>
                  <span className="text-white truncate max-w-[250px]">{studyInstanceUid || 'Chua load'}</span>
                </div>
              </div>

              <div className="bg-[#0D1B20] border border-[#1A323A] rounded p-3 text-sm">
                <h3 className="text-white font-semibold mb-2">Services</h3>
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">Auth / Phien lam viec:</span>
                  {renderStatus(diagnostics.services.auth.ok)}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">Database Connection:</span>
                  {renderStatus(diagnostics.services.database.ok)}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">DICOMweb Config:</span>
                  {renderStatus(diagnostics.services.dicomweb.ok)}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8899A6]">Report Workspace API:</span>
                  {renderStatus(diagnostics.services.reportWorkspace.ok)}
                </div>
              </div>

              {diagnostics.warnings && diagnostics.warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 text-sm">
                  <h3 className="text-yellow-400 font-semibold mb-1">Canh bao:</h3>
                  <ul className="list-disc list-inside text-yellow-200 space-y-1">
                    {diagnostics.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1A323A] flex justify-between bg-[#102126]">
          <button 
             className="px-4 py-1.5 rounded text-[#8899A6] hover:text-white hover:bg-[#1A323A] text-sm transition-colors"
             onClick={handleCopy}
             disabled={isLoading || !diagnostics}
          >
            Copy Text
          </button>
          <button 
            className="px-4 py-1.5 rounded text-white bg-[#00B5B8] hover:bg-[#009598] text-sm transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  );
};
