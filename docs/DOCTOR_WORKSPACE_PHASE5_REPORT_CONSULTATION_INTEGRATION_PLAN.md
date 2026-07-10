# Phase 5 — Kế hoạch chi tiết Báo cáo và Hội chẩn trong Workspace

Ngày lập: 2026-07-11  
Thuộc master plan: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 4 selection/layout/related endpoint ổn định

## 1. Mục tiêu

Đưa luồng đọc–soạn–lưu nháp–ký/duyệt–gửi HIS và hội chẩn vào vùng 7 mà không đổi lifecycle hiện hữu, không mất draft và không dựa vào UI để cấp quyền.

## 2. Workspace detail contract

`getStudyWorkspace(studyUid)` trả patient/study header, report revision/status, template suggestions tối thiểu, consultation summary, viewer/key-image links và `allowedActions` tính batch từ global + scope + workflow. READ_STUDY không tự trả report content; cần READ_REPORT. Action endpoint luôn gọi `requireScopedStudyAccess` và workflow service ngay trước transaction.

Không trả secrets/HIS raw payload; lỗi ngoài scope generic. Payload editor có schema/size limits và sanitize theo baseline hiện hữu.

## 3. Draft state machine và autosave

```text
CLEAN → DIRTY → SAVING → SAVED
                  └→ ERROR (retry, vẫn DIRTY)
server revision đổi → CONFLICT (không overwrite)
```

- Autosave debounce sau thay đổi và heartbeat có giới hạn; chỉ một save in-flight/study.
- Payload gồm `studyUid`, editable fields, `baseRevision`/`expectedUpdatedAt`, idempotency key.
- Server conditional update/transaction; stale revision trả typed conflict cùng metadata tối thiểu.
- Không báo `Đã lưu` trước server ack. Offline/session expiry giữ nội dung trong memory và cảnh báo; local recovery nếu dùng phải threat-model PHI, mã hóa/TTL và được phê duyệt riêng.
- Đổi ca/đóng panel/navigation: nếu DIRTY, thử save hoặc dialog `Lưu và chuyển / Bỏ thay đổi / Ở lại`; không dùng `beforeunload` làm lớp duy nhất.

## 4. Actions và workflow

- Read-only: editor không contenteditable, nút mutation không render, direct call vẫn deny.
- Draft/sign/approve/unfinalize/deliver/HIS map đúng capability + global permission + current status.
- Sign/approve dùng latest revision guard; double submit idempotent; audit actor/revision/transition.
- HIS failure không rollback finalized report nếu policy hiện hữu tách delivery; hiển thị retry theo quyền và trạng thái thực.
- Concurrent doctor: optimistic conflict, không last-write-wins im lặng; có reload/compare/copy unsaved text an toàn.

## 5. Consultation/viewer/key image

Facet Phase 3 giữ nguyên; vùng 7 cho tạo/mở hội chẩn khi `CREATE_CONSULT` và lifecycle cho phép. Second read là policy/action riêng, không giả bằng consultation status. Viewer/deep link dùng technical IDs và server context scope-safe. Key images chỉ hiển thị/tạo khi viewer artifact endpoints áp scope; không nhúng blob lớn vào workspace response.

## 6. PR slices

1. **P5-PR1 Workspace detail + allowedActions contract.**
2. **P5-PR2 Report panel read-only/template/editor extraction.**
3. **P5-PR3 Revisioned draft save + autosave telemetry/tests.**
4. **P5-PR4 Dirty navigation guard + conflict recovery.**
5. **P5-PR5 Sign/approve/unfinalize/deliver/HIS hardening.**
6. **P5-PR6 Consultation/second-read/viewer/key-image integration.**
7. **P5-PR7 End-to-end clinical UAT, feature flag and rollback.**

## 7. Test matrix

- View-only không sửa bằng UI/direct action; READ_STUDY không đọc report.
- Rapid typing/out-of-order response không mất ký tự; save error không giả success.
- A dirty → chọn B: cả ba lựa chọn đúng; cancelled navigation giữ A.
- Hai session sửa cùng revision: một commit, một conflict; không overwrite.
- Double sign/retry network idempotent; stale status/revision bị từ chối.
- Session expiry giữa save/sign; scope grant bị revoke giữa lúc panel mở; server deny lần ghi kế tiếp.
- HIS/consult/viewer unavailable có degraded state không mất report.
- Audit không chứa full report text; telemetry chỉ revision/result/duration/reason code.

## 8. Definition of Done

- [ ] Không mất draft trong các kịch bản UAT đã chốt; conflict không overwrite im lặng.
- [ ] Allowed actions nhất quán nhưng mọi endpoint re-authorize/revalidate workflow.
- [ ] Read-only, autosave, dirty guard, signing/approval/HIS có accessibility và error recovery.
- [ ] Report lifecycle/audit baseline không đổi ngoài thay đổi được phê duyệt.
- [ ] Security/concurrency/E2E/build gates pass và rollback về report page cũ khả dụng trong pilot.
## Chỉ mục kế hoạch PR chi tiết

1. [Study Workspace Detail và Allowed Actions](./DOCTOR_WORKSPACE_PHASE5_PR1_STUDY_WORKSPACE_DETAIL_PLAN.md)
2. [Report Panel Extraction và Read-only Mode](./DOCTOR_WORKSPACE_PHASE5_PR2_REPORT_PANEL_EXTRACTION_PLAN.md)
3. [Revisioned Draft Autosave](./DOCTOR_WORKSPACE_PHASE5_PR3_REVISIONED_AUTOSAVE_PLAN.md)
4. [Dirty Guard và Conflict Recovery](./DOCTOR_WORKSPACE_PHASE5_PR4_DIRTY_GUARD_CONFLICT_RECOVERY_PLAN.md)
5. [Sign, Approve, Unfinalize, Delivery và HIS Hardening](./DOCTOR_WORKSPACE_PHASE5_PR5_REPORT_ACTION_HARDENING_PLAN.md)
6. [Consultation, Second Read, Viewer và Key Image](./DOCTOR_WORKSPACE_PHASE5_PR6_CONSULTATION_VIEWER_KEY_IMAGE_PLAN.md)
7. [Clinical Workspace UAT và Rollback](./DOCTOR_WORKSPACE_PHASE5_PR7_CLINICAL_WORKSPACE_UAT_PLAN.md)
