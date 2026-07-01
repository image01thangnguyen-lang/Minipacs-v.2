import React, { useState, useEffect } from 'react';
import { viewerReportWorkspaceService, ViewerReportWorkspaceResponse } from '../services/viewerReportWorkspaceService';

export const MiniPacsReportWorkspaceDialog = ({ servicesManager, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [studyInstanceUid, setStudyInstanceUid] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<ViewerReportWorkspaceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeasurements, setSelectedMeasurements] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleOpen = async (e: CustomEvent) => {
      if (e.detail?.dialogId === 'report-workspace') {
        const uid = e.detail.studyInstanceUid;
        if (!uid) return;
        setStudyInstanceUid(uid);
        setIsOpen(true);
        setIsLoading(true);
        const data = await viewerReportWorkspaceService.loadWorkspace(uid);
        setWorkspace(data);
        setIsLoading(false);
        // Default select all safe measurements
        if (data?.measurements) {
          setSelectedMeasurements(new Set(data.measurements.filter(m => m.isSafeForReport).map(m => m.measurementUID)));
        }
        if (data?.keyImages || data?.snapshots) {
          const imgIds = [...(data.keyImages || []).map(i => i.id), ...(data.snapshots || []).map(s => s.id)];
          setSelectedImages(new Set(imgIds));
        }
      }
    };
    window.addEventListener('minipacs:open-dialog', handleOpen as EventListener);
    return () => window.removeEventListener('minipacs:open-dialog', handleOpen as EventListener);
  }, []);

  if (!isOpen || !studyInstanceUid) return null;

  const handleSendMeasurements = async () => {
    if (selectedMeasurements.size === 0) return;
    const { success, requiresAddendum } = await viewerReportWorkspaceService.sendMeasurements(
      studyInstanceUid,
      Array.from(selectedMeasurements),
      'replace_measurement_section'
    );
    if (success || requiresAddendum) {
      const data = await viewerReportWorkspaceService.loadWorkspace(studyInstanceUid);
      setWorkspace(data);
    }
  };

  const handleSendImages = async () => {
    if (selectedImages.size === 0) return;
    const { success, requiresAddendum } = await viewerReportWorkspaceService.sendKeyImages(
      studyInstanceUid,
      Array.from(selectedImages),
      'replace_image_section'
    );
    if (success || requiresAddendum) {
      const data = await viewerReportWorkspaceService.loadWorkspace(studyInstanceUid);
      setWorkspace(data);
    }
  };

  const handleOpenReport = () => {
    if (workspace?.report.url) {
      window.open(new URL(workspace.report.url, window.location.origin).toString(), '_blank');
    }
  };

  const toggleMeasurement = (uid: string) => {
    const next = new Set(selectedMeasurements);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelectedMeasurements(next);
  };

  const toggleImage = (id: string) => {
    const next = new Set(selectedImages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedImages(next);
  };

  const isFinal = workspace?.report.status === 'final' || workspace?.report.status === 'completed';
  const hasMeasurements = workspace?.measurements && workspace.measurements.length > 0;
  const hasImages = (workspace?.keyImages?.length || 0) > 0 || (workspace?.snapshots?.length || 0) > 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#102126] border border-[#1A323A] rounded shadow-2xl flex flex-col w-[600px] max-h-[80vh]">
        <div className="p-4 border-b border-[#1A323A] flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">Report Workspace</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#8899A6] hover:text-white">&times;</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-[#8899A6]">Dang tai...</div>
          ) : !workspace ? (
            <div className="text-red-400">Khong the tai Report Workspace.</div>
          ) : (
            <div className="space-y-6">
              {/* Status Section */}
              <div className="bg-[#0D1B20] border border-[#1A323A] rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#8899A6] text-sm">Trang thai bao cao:</span>
                  <span className={`px-2 py-0.5 rounded text-xs uppercase ${isFinal ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'}`}>
                    {workspace.report.status || 'Chua co'}
                  </span>
                </div>
                {isFinal && (
                  <p className="text-sm text-yellow-400 mb-2">
                    Bao cao da final. Ban co the gui do dac/anh de tao phu luc/addendum.
                  </p>
                )}
                {!workspace.report.canWrite && (
                  <p className="text-sm text-red-400">
                    Ban khong co quyen sua bao cao.
                  </p>
                )}
              </div>

              {/* Measurements Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-semibold">Do dac ({workspace.measurements.length})</h3>
                  {workspace.report.canWrite && hasMeasurements && (
                    <button 
                      className="px-3 py-1 rounded text-white bg-[#00B5B8] hover:bg-[#009598] text-xs transition-colors disabled:opacity-50"
                      onClick={handleSendMeasurements}
                      disabled={selectedMeasurements.size === 0}
                    >
                      {isFinal ? 'Tao phu luc do dac' : 'Gui do dac vao bao cao'}
                    </button>
                  )}
                </div>
                {hasMeasurements ? (
                  <div className="bg-[#0D1B20] border border-[#1A323A] rounded p-2 max-h-[150px] overflow-y-auto space-y-1">
                    {workspace.measurements.map(m => (
                      <label key={m.measurementUID} className={`flex items-start gap-2 p-1.5 rounded ${m.isSafeForReport ? 'hover:bg-[#1A323A]' : 'opacity-50'} cursor-pointer`}>
                        <input 
                          type="checkbox" 
                          className="mt-1"
                          checked={selectedMeasurements.has(m.measurementUID)}
                          onChange={() => m.isSafeForReport && toggleMeasurement(m.measurementUID)}
                          disabled={!m.isSafeForReport}
                        />
                        <div className="flex-1 text-sm text-[#8899A6]">
                          <span className="text-white block">{m.summaryText}</span>
                          {!m.isSafeForReport && <span className="text-red-400 text-xs block">{m.unsafeReason}</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#8899A6] italic">Chua co do dac nao.</div>
                )}
              </div>

              {/* Images Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-white text-sm font-semibold">Key Images / Snapshots</h3>
                  {workspace.report.canWrite && hasImages && (
                    <button 
                      className="px-3 py-1 rounded text-white bg-[#00B5B8] hover:bg-[#009598] text-xs transition-colors disabled:opacity-50"
                      onClick={handleSendImages}
                      disabled={selectedImages.size === 0}
                    >
                      {isFinal ? 'Tao phu luc anh' : 'Gui anh vao bao cao'}
                    </button>
                  )}
                </div>
                {hasImages ? (
                  <div className="bg-[#0D1B20] border border-[#1A323A] rounded p-2 max-h-[150px] overflow-y-auto space-y-1">
                    {workspace.keyImages.map(img => (
                      <label key={img.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#1A323A] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedImages.has(img.id)}
                          onChange={() => toggleImage(img.id)}
                        />
                        <span className="text-sm text-[#8899A6]">Key image: {img.label || 'Khong co nhan'}</span>
                      </label>
                    ))}
                    {workspace.snapshots.map(sn => (
                      <label key={sn.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#1A323A] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedImages.has(sn.id)}
                          onChange={() => toggleImage(sn.id)}
                        />
                        <span className="text-sm text-[#8899A6]">Snapshot: {sn.label || 'Khong co nhan'}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[#8899A6] italic">Chua co anh nao.</div>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1A323A] flex justify-between bg-[#102126]">
          <button 
             className="px-4 py-1.5 rounded text-white bg-[#1A323A] hover:bg-[#2A424A] text-sm transition-colors"
             onClick={() => viewerReportWorkspaceService.exportDicomSR(studyInstanceUid)}
             disabled={isLoading || !workspace?.report.canWrite}
             title="Chi tao khung DICOM SR (Deferred) neu cau hinh mapping chua du"
          >
            Xuat DICOM SR
          </button>
          <div className="flex gap-2">
            <button 
              className="px-4 py-1.5 rounded text-white bg-[#1A323A] hover:bg-[#2A424A] text-sm transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dong
            </button>
            <button 
              className="px-4 py-1.5 rounded text-white bg-[#00B5B8] hover:bg-[#009598] text-sm transition-colors"
              onClick={handleOpenReport}
              disabled={isLoading || !workspace}
            >
              Mo Bao Cao
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
