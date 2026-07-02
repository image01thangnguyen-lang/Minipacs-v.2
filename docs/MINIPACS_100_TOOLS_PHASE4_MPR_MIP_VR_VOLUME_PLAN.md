\# MiniPACS 100+ Tools - Phase 4 MPR, MIP, VR And Volume Imaging Plan



Updated: 2026-07-02



\## 1. Phase 4 Goal



Phase 4 đưa MiniPACS từ viewer 2D nâng cao sang workflow thể tích CT/MR/PET có kiểm soát.



Mục tiêu:



\- Bật MPR/MIP/VR cho study reconstructable.

\- Hỗ trợ axial, coronal, sagittal, oblique MPR.

\- Hỗ trợ curved/freehand MPR ở mức an toàn nếu nền tảng cho phép.

\- Hỗ trợ 3D cursor/crosshairs và một số annotation 3D cơ bản.

\- Không phá workflow 2D, measurement persistence, layout, report bridge của Phase 1-3.



\## 2. Entry Criteria



Chỉ bắt đầu Phase 4 khi:



\- Phase 1 core viewer ổn định.

\- Phase 2 measurement/annotation persistence không lỗi nghiêm trọng.

\- Phase 3 advanced 2D tools không gây regression.

\- Có dataset CT/MR reconstructable thật để test.

\- Có guard phân biệt study reconstructable và non-reconstructable.

\- Tool registry đã có status/deferred reason rõ.



\## 3. In Scope



View type:



\- Axial

\- Coronal

\- Sagittal

\- MIP

\- 3DMPR

\- VR



MPR workflow:



\- Basic Orthogonal

\- Oblique MPR

\- Curved MPR, nếu khả thi

\- Freehand MPR, nếu khả thi

\- Crosshairs / 3D cursor

\- Reset về basic orthogonal

\- Exit MPR và restore layout 2D



Volume tools:



\- Volume Measure, mức cơ bản nếu metadata và volume segmentation đủ an toàn

\- Temp Volume

\- View with T volume images, chỉ khi data model xác nhận rõ



3D annotation cơ bản:



\- 3D cursor

\- 3D arrow

\- 3D text

\- 3D line

\- 3D curve

\- Pick Object



VR interaction:



\- 3D rotation

\- Camera presets

\- Transfer function presets

\- Safe crop preview, chưa làm sculpt production



\## 4. Out Of Scope



Không làm trong Phase 4:



\- 3D sculpt production.

\- VOI Move / Rotation / Thickness / Center.

\- Virtual endoscopy path/camera workflow.

\- Native Xelis launcher.

\- CD burn, scanner, local folder, direct film print.

\- Global/multi-monitor capture.

\- DICOM SR/GSPS/KO authoring mở rộng nếu chưa validated.



Các mục này để Phase 5.



\## 5. Technical Approach



Ưu tiên dùng OHIF/Cornerstone3D trước:



\- Cornerstone3D `VolumeViewport`

\- Streaming volume loader/cache

\- Crosshairs synchronizer

\- ToolGroup riêng cho MPR/volume

\- Existing OHIF MPR/HangingProtocol nếu repo đã có



Dùng VTK.js cho phần volume nâng cao:



\- `vtkImageReslice`

\- `vtkVolumeMapper`

\- `vtkColorTransferFunction`

\- `vtkPiecewiseFunction`

\- `vtkCamera`



Bắt buộc có guard:



\- Modality phải phù hợp: CT/MR, PET nếu hỗ trợ.

\- Series phải reconstructable.

\- Volume load không vượt GPU/memory budget.

\- Không vào MPR/VR nếu thiếu slices hoặc geometry không hợp lệ.



\## 6. Work Packages



\### WP1 - Volume Eligibility Audit



\- Xác định cách repo hiện tại nhận biết `isReconstructable`.

\- Kiểm tra CT/MR/PET series metadata.

\- Tạo service guard: `viewerVolumeEligibilityService`.

\- Non-reconstructable study phải báo rõ, không crash.



\### WP2 - MPR Entry And Exit Workflow



\- Tạo command wrapper: `toggleMiniPacsMpr`.

\- Khi vào MPR, lưu layout 2D hiện tại.

\- Khi thoát MPR, restore layout/series active trước đó.

\- Không làm mất Phase 2 measurement stack state.



\### WP3 - Orthogonal MPR And Crosshairs



\- Bật axial/coronal/sagittal.

\- Đồng bộ crosshairs giữa các plane.

\- Cho phép reset về basic orthogonal.

\- Tắt crosshairs sạch khi thoát MPR.



\### WP4 - MIP And VR Mode



\- Thêm MIP mode cho volume phù hợp.

\- Thêm VR mode với transfer function preset cơ bản.

\- Thêm camera/rotation controls.

\- Có fallback nếu GPU không đủ.



\### WP5 - Oblique, Curved, Freehand MPR



\- Oblique MPR ưu tiên trước.

\- Curved/freehand MPR chỉ làm nếu reslice path đủ ổn định.

\- Nếu chưa đủ nền, để status `deferred-advanced` kèm lý do.



\### WP6 - 3D Annotation Basic



\- 3D cursor/pick object trước.

\- 3D line/curve/text/arrow chỉ làm nếu mapping tọa độ world ổn định.

\- Không persist 3D measurement vào report nếu chưa chắc mapping SOP/frame.



\### WP7 - Registry And UI



\- Cập nhật `minipacsToolRegistry.ts`.

\- Tách rõ group MPR/3D/VR.

\- Disabled state cho unsupported modality.

\- Tooltip phải nói rõ yêu cầu: CT/MR reconstructable.



\### WP8 - QA And Performance



\- Test CT chest/abdomen, MR spine/brain.

\- Test non-reconstructable DX/US không crash.

\- Test enter/exit MPR nhiều lần.

\- Test memory growth.

\- Test Phase 1-3 regression.



\## 7. Acceptance Criteria



Phase 4 hoàn thành khi:



\- CT/MR reconstructable vào MPR được.

\- Axial/coronal/sagittal hiển thị đúng và sync crosshairs.

\- Thoát MPR restore workflow 2D an toàn.

\- MIP/VR hoạt động hoặc defer rõ theo GPU/data support.

\- Non-reconstructable study bị chặn mềm, không crash.

\- Phase 2 measurement persistence không bị phá.

\- Phase 3 tools không regression.

\- Không có nút 3D/MPR silent no-op.



\## 8. Prompt For Another AI Implementation Agent



You are working in the `Minipacs-v.2` repository.



Your task is to implement Phase 4 of the MiniPACS 100+ tools roadmap: \*\*MPR, MIP, VR And Volume Imaging\*\*.



Read these documents first:



\- `docs/MINIPACS\_100\_TOOLS\_MASTER\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE1\_WEB\_ONLY\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE2\_2D\_CLINICAL\_TOOLS\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE3\_ADVANCED\_2D\_SPECIALTY\_WORKFLOW\_PLAN.md`

\- `docs/MINIPACS\_100\_TOOLS\_PHASE4\_MPR\_MIP\_VR\_VOLUME\_PLAN.md`



Primary goal:



Add safe CT/MR/PET volume workflows using OHIF v3.7, Cornerstone3D VolumeViewport, and VTK.js where needed. Implement MPR/MIP/VR only for reconstructable studies, while preserving all Phase 1-3 2D behavior.



Scope:



\- Axial, Coronal, Sagittal view types.

\- Basic Orthogonal MPR.

\- MIP mode.

\- VR mode where supported.

\- Oblique MPR if feasible.

\- Curved MPR and Freehand MPR only if the current architecture supports safe reslicing.

\- Crosshairs / 3D cursor.

\- 3D rotation and basic camera controls.

\- Basic 3D annotation only if world-coordinate mapping is stable.

\- Safe enter/exit MPR workflow with layout restore.



Architecture rules:



\- Use existing OHIF/Cornerstone3D services first.

\- Use `VolumeViewport` for volume workflows.

\- Use VTK.js only where Cornerstone3D/OHIF is insufficient.

\- Add reconstructability guards before enabling MPR/MIP/VR.

\- Keep `minipacsToolRegistry.ts` as source of truth.

\- Route all tool clicks through MiniPACS command bridge.

\- No DOM-click hacks as final behavior.

\- Do not break Phase 2 measurement persistence.

\- Do not persist 3D measurements into report unless SOP/frame/world mapping is validated.

\- Non-reconstructable studies must show controlled feedback and must not crash.



Do not implement:



\- 3D sculpt production.

\- VOI editing tools.

\- Virtual endoscopy.

\- Native Xelis launcher.

\- Scanner/CD/local folder/direct print/global capture.

\- Vendor D.gate/TFS integration.



Required work packages:



1\. Audit existing volume/MPR support in the repo.

2\. Add volume eligibility guard service.

3\. Implement safe MPR enter/exit workflow.

4\. Implement orthogonal MPR and crosshairs.

5\. Implement MIP/VR where supported.

6\. Add oblique/curved/freehand MPR only if safe, otherwise defer.

7\. Update registry statuses and UI grouping.

8\. Add QA notes or QA report for Phase 4.



Acceptance criteria:



\- CT/MR reconstructable studies enter MPR safely.

\- Axial/coronal/sagittal viewports render correctly.

\- Crosshairs sync works or is clearly deferred.

\- MPR exit restores 2D workflow.

\- Non-reconstructable studies are blocked gracefully.

\- MIP/VR work or are clearly deferred with reason.

\- Phase 1-3 workflows still work.

\- No visible Phase 4 button is a silent no-op.



Before finishing:



\- Run available build/static checks if dependencies are present.

\- If checks cannot run, state why.

\- Provide implementation summary.

\- List files changed.

\- List deferred Phase 4 tools and reasons.

\- List known performance/GPU limitations.

