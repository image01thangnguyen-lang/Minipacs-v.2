\# MiniPACS 100+ Tools - Master Plan And Phasing



Updated: 2026-07-02



\## Classification



\- Class A - OHIF/Cornerstone ready: Pan, Zoom, Windowing, Stack Scroll, Fit, Reset, Cine, Layout, DICOM Info, Length/Angle/ROI basic tools.

\- Class B - MiniPACS web/API: Worklist, View, View to dictate, Report, Related Exam, Key Image, Snapshot, Settings, Audit.

\- Class C - Custom 2D Cornerstone3D: shutters, filters, pseudo color, CT Ratio, LLD, Spine tools, Profile, 2D table, calibration-heavy measurements.

\- Class D - Advanced volume/VTK.js: MPR, MIP, VR, 3D cursor, 3D annotation, curved/freehand/oblique MPR.

\- Class E - Native/external: CD burn, scan doc, local folder, direct print, global capture, Xelis, D.gate/TFS.



\## Phase 1 - Web-Only Foundation



Use OHIF v3.7 services and Cornerstone3D tools for daily 2D review.



Milestone: open study, navigate series, use Pan/Zoom/WL/Stack/Fit/Reset, switch layout, apply presets, open report/DICOM info, defer unsupported native/advanced tools.



Tech: OHIF mode/extension, ToolbarService, ViewportGridService, DisplaySetService, HangingProtocolService, CineService, commandsManager, @cornerstonejs/tools.



\## Phase 2 - Clinical 2D, Persistence, Capture, Reporting



Implement real 2D clinical workflow.



Tools: 2D arrow/text/box, line/curve/angle, area measurements, Cobb, HU/SUV probe, ratio, key image, snapshot, capture as shown, measurement persistence, report workspace.



Tech: Cornerstone annotations, custom BaseTool, MeasurementService, MiniPACS measurement/key-image/snapshot APIs, dcmjs for SR/KO/GSPS strategy.



\## Phase 3 - Advanced 2D And Specialty Workflow



Implement richer 2D tools that are still browser-safe.



Tools: 100% zoom, actual size, select all/inverse/image set, shutters, sharpen, average filter, pseudo color, CT Ratio, LLD, Spine tools, Time Intensity Curve, advanced HP/sync.



Tech: custom Cornerstone3D tools, pixel spacing/calibration metadata, SyncGroupService, CineService, HangingProtocolService, canvas/WebGL filters.



\## Phase 4 - MPR, MIP, VR, Volume Imaging



Add CT/MR volume workflows.



Tools: axial/coronal/sagittal, MIP, 3DMPR, VR, oblique MPR, curved MPR, freehand MPR, 3D cursor, volume measure, 3D annotations.



Tech: Cornerstone3D VolumeViewport, VTK.js, vtkImageReslice, vtkVolumeMapper, transfer functions, GPU memory guards.



\## Phase 5 - 3D Sculpt, Virtual Endoscopy, Native/Desktop



Split into 5A and 5B.



5A: 3D sculpt, VOI move/rotation/thickness/center, virtual endoscopy path/camera tools.



5B: Send Local DICOM, CD Burn, Open local folder, Scan Doc, Direct Print, global capture, dictation hardware, Execute 3D/Xelis, D.gate/TFS.



Tech: VTK.js segmentation/masks, Electron/Tauri or native companion, TWAIN/WIA/SANE, DICOM DIMSE/STOW-RS, DICOM Print SCU, vendor adapters.

