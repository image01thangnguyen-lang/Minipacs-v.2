# Ke hoach chi tiet Phase 7 - Sharing And Consultation

Updated: 2026-07-04

## 1. Muc tieu

Phase 7 trien khai hai nhom workflow con thieu trong VRPACS:

- Share link: chia se ca chup/ket qua qua link bao ve, co het han, mat khau tuy chon, QR, an thong tin benh nhan tuy chon, revoke, audit.
- Consultation: hoi chan online/co dieu phoi, tao yeu cau hoi chan tu ca DICOM hoac Non-DICOM, moi thanh vien, mo phong/ket noi room, chat, theo doi lifecycle, ket thuc/huy co audit.

Nguyen tac tiep tuc tu Phase 5/6: **bat ky schema, backend, service, API, permission, job, route nao duoc tao trong Phase 7 deu phai co UI hien thi/tuong tac tuong ung**. Khong co tinh nang chi ton tai trong code.

Muc tieu cuoi phase:

- Bac si/nguoi duoc cap quyen co the tao share link tu Study List, Report detail, Archive, Non-DICOM detail, hoac Viewer/Report workspace.
- Share link co expiry bat buoc, password tuy chon, QR, revoke, copy link, audit access.
- Public share viewer la read-only, scoped theo link, khong dung session noi bo, khong co action ghi/sua/xoa.
- Share viewer co tuy chon hide patient info, dung ro label "Thong tin da duoc an" neu bat.
- Consultation co queue rieng: requested, started, in-progress, finished, cancelled.
- Consultation co room detail UI: case summary, participants, chat, activity, link mo viewer/read-only artifact.
- Neu WebRTC/video provider chua cau hinh, UI hien disabled/tooltip ro va van cho chat/lifecycle MVP.
- DICOM va Non-DICOM deu co the duoc share/consult theo cung mot policy.
- Tat ca share/consult events co audit va hien lai tren UI.

## 2. Khong nam trong Phase 7

Phase 7 khong lam cac viec sau:

- Khong lam destructive delete study/series/media. Phan nay thuoc Phase 8.
- Khong lam retention/backup/export DICOM bulk production. Phan nay thuoc Phase 8.
- Khong lam native workstation/CD burn/scanner/open folder. Phan nay thuoc Phase 9.
- Khong hard-code video provider credential hoac public TURN/STUN token.
- Khong dua PHI vao token, URL path, QR payload ngoai token ngau nhien.
- Khong mo public access truc tiep toi Orthanc, filePath noi bo, hoac protected media path.
- Khong sua trang thai report/study tu Consultation. Consultation la workflow lien quan, khong auto finalize/cancel report.
- Khong cho public viewer download/export neu khong co scope rieng.
- Khong public chat/video khi share link het han/revoked.

Neu tinh nang can provider ngoai (WebRTC, SMS, email, Zalo, etc.) ma chua co config, chi tao integration boundary va UI disabled state.

## 3. Dieu kien tien quyet

Chi nen bat dau Phase 7 khi:

- Phase 1 report/delivery/archive workflow on dinh.
- Phase 2 HIS status visible va retryable.
- Phase 3 permissions/admin catalog on dinh.
- Phase 3.5 da dua operational fields ra UI.
- Phase 4 viewer action history/download/artifact boundary da co.
- Phase 6 Non-DICOM co queue/detail/media/report/archive integration.
- Permission server-side da co pattern chung.
- AuditLog co the ghi metadataJson va actorUserId.
- Co policy ve patient info hiding va public read-only scope.

## 4. He thong hien tai can ke thua

Truoc khi code can doc va ke thua:

```text
docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
docs/VRPACS_WORKFLOW_STATUS_POLICY.md
docs/VRPACS_PERMISSION_ACTION_MATRIX.md
docs/VRPACS_TERMINOLOGY_MAP.md
docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md
docs/VRPACS_PHASE1_DICOM_WORKFLOW_PARITY_PLAN.md
docs/VRPACS_PHASE2_HIS_INTEGRATION_PLAN.md
docs/VRPACS_PHASE3_ADMIN_CATALOG_PERMISSION_PLAN.md
docs/VRPACS_PHASE3_5_OPERATIONAL_UI_VISIBILITY_PLAN.md
docs/VRPACS_PHASE4_VIEWER_WEB_PARITY_PLAN.md
docs/VRPACS_PHASE6_NON_DICOM_CAPTURE_MODULE_PLAN.md
dashboard/prisma/schema.prisma
dashboard/lib/permissions.ts
dashboard/lib/workflowService.ts
dashboard/app/actions.ts
dashboard/app/page.tsx
dashboard/app/report/[studyInstanceUid]/page.tsx
dashboard/app/archive/page.tsx
dashboard/app/non-dicom/page.tsx
dashboard/app/non-dicom/[id]/page.tsx
dashboard/app/api/viewer/studies/[uid]/context/route.ts
dashboard/app/api/non-dicom/[id]/media/[mediaId]/route.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/commandsModule.ts
```

Phase 7 phai mo rong dashboard/viewer hien co, khong tao app share/consult tach roi neu khong can.

## 5. Nguyen tac UI visibility bat buoc

### 5.1 Moi feature phai co UI

Moi bang/field/action moi phai co UI:

- Share link model -> share management UI.
- Share access log -> UI lich su truy cap.
- Consultation status -> consultation queue/status badge.
- Consultation participant -> participant list UI.
- Consultation message -> chat UI.
- Provider config -> admin/settings UI hoac disabled reason.

### 5.2 UI noi that

Nut chi active khi:

- User co permission.
- Study/exam/report ton tai.
- Link chua expired/revoked.
- Scope cho phep action.
- Provider neu can da cau hinh.

Neu khong du dieu kien:

- Hide neu user khong co quyen.
- Disabled + tooltip neu thieu cau hinh/provider/data.
- Backend van reject direct call.

### 5.3 UI surfaces bat buoc

Phase 7 can co cac UI surface:

- Study List row action: Share, Request consult.
- Report detail: Share final report, share viewer artifacts, create consultation.
- Archive: Share/revoke/view share history, create consultation from archived final case.
- Non-DICOM detail: Share gallery/media/report, create consultation.
- Viewer action menu/left panel: open share dialog or consultation request when current study available.
- Share management dialog: create/copy/QR/revoke/access log.
- Public share viewer route.
- Consultation queue route.
- Consultation room route.
- Sidebar entry for Consultation.
- Statistics small cards for active shares/consultations if practical.
- Admin/settings UI for provider config status if video provider is in scope.

## 6. Permission contract de xuat

Them hoac map permission:

| Permission | Muc dich | Default actors |
| --- | --- | --- |
| `share.read` | Xem share links/logs noi bo | ADMIN, DOCTOR, TECHNICIAN theo policy |
| `share.create` | Tao share link | ADMIN, DOCTOR |
| `share.revoke` | Thu hoi share link | ADMIN, creator, DOCTOR theo policy |
| `share.manage` | Quan tri tat ca share links | ADMIN |
| `consult.read` | Xem danh sach/room hoi chan | ADMIN, DOCTOR, TECHNICIAN theo policy |
| `consult.create` | Tao yeu cau hoi chan | ADMIN, DOCTOR |
| `consult.invite` | Moi/xoa participant | ADMIN, creator, DOCTOR theo policy |
| `consult.start` | Bat dau room | ADMIN, assigned doctor/creator |
| `consult.message` | Gui chat/message | participant duoc phep |
| `consult.finish` | Ket thuc hoi chan | ADMIN, creator/host |
| `consult.cancel` | Huy hoi chan voi reason | ADMIN, creator/host |
| `consult.admin` | Quan tri toan bo consultation | ADMIN |

Khong reuse moi `studies.read` cho share/consult vi public exposure va participant workflow can audit rieng.

## 7. Data model de xuat

### 7.1 ShareLink

Muc dich: dai dien mot public/read-only link.

Fields:

- `id`
- `tokenHash` unique, khong luu raw token.
- `shortCode` unique optional de UI/QR gon.
- `scope`: `STUDY | REPORT | NON_DICOM_EXAM | MEDIA_SET | VIEWER_ARTIFACTS`
- `studyInstanceUid`
- `imagingStudyId`
- `reportId`
- `nonDicomExamId`
- `createdByUserId`
- `status`: `ACTIVE | REVOKED | EXPIRED | LOCKED`
- `expiresAt`
- `revokedAt`
- `revokedByUserId`
- `revokeReason`
- `passwordHash`
- `passwordRequired`
- `failedPasswordAttempts`
- `lockedAt`
- `hidePatientInfo`
- `allowDownload`
- `allowImages`
- `allowReport`
- `allowMeasurements`
- `maxAccessCount`
- `accessCount`
- `lastAccessedAt`
- `metadataJson`
- `createdAt`
- `updatedAt`

Indexes:

- `tokenHash`
- `shortCode`
- `status`
- `expiresAt`
- `studyInstanceUid`
- `createdByUserId`

Rules:

- Expiry bat buoc.
- Raw token chi tra ve mot lan khi create.
- Password hash dung bcrypt/argon helper hien co.
- `allowDownload=false` mac dinh cho MVP.
- `hidePatientInfo=true` nen la default neu chia se ngoai he thong.

### 7.2 ShareAccessLog

Fields:

- `id`
- `shareLinkId`
- `eventType`: `OPENED | PASSWORD_FAILED | PASSWORD_PASSED | VIEWED_REPORT | VIEWED_IMAGE | DOWNLOAD_DENIED | EXPIRED_DENIED | REVOKED_DENIED`
- `ipHash`
- `userAgentHash`
- `viewerSessionId`
- `metadataJson`
- `createdAt`

Khong luu IP raw neu khong co policy; hash hoac scrub.

### 7.3 ShareMediaSelection

Neu share media subset:

- `id`
- `shareLinkId`
- `mediaType`: `VIEWER_KEY_IMAGE | VIEWER_SNAPSHOT | NON_DICOM_MEDIA`
- `mediaId`
- `sortOrder`
- `createdAt`

MVP co the luu JSON trong `metadataJson`, nhung model rieng de query/UI tot hon.

### 7.4 Consultation

Fields:

- `id`
- `consultCode` unique
- `title`
- `reason`
- `status`: `REQUESTED | STARTED | IN_PROGRESS | FINISHED | CANCELLED`
- `priority`: `ROUTINE | URGENT | STAT`
- `sourceType`: `DICOM | NON_DICOM | REPORT | ARCHIVE`
- `studyInstanceUid`
- `imagingStudyId`
- `reportId`
- `nonDicomExamId`
- `createdByUserId`
- `hostUserId`
- `assignedDoctorId`
- `startedAt`
- `finishedAt`
- `cancelledAt`
- `cancelReason`
- `videoProvider`
- `videoRoomId`
- `videoJoinUrlInternal`
- `providerStatus`: `DISABLED | READY | FAILED`
- `metadataJson`
- `createdAt`
- `updatedAt`

Indexes:

- `status`
- `priority`
- `studyInstanceUid`
- `nonDicomExamId`
- `createdByUserId`
- `hostUserId`
- `createdAt`

### 7.5 ConsultationParticipant

Fields:

- `id`
- `consultationId`
- `userId`
- `displayName`
- `role`: `HOST | CONSULTANT | OBSERVER | EXTERNAL`
- `status`: `INVITED | JOINED | LEFT | REMOVED`
- `invitedByUserId`
- `joinedAt`
- `leftAt`
- `createdAt`

MVP nen uu tien internal users. External participants chi qua share link/guest token neu policy ro.

### 7.6 ConsultationMessage

Fields:

- `id`
- `consultationId`
- `senderUserId`
- `senderDisplayName`
- `messageType`: `TEXT | SYSTEM`
- `body`
- `metadataJson`
- `createdAt`

Rules:

- Message immutable.
- Khong cho public share user gui chat neu khong la participant.
- Co server-side membership check.

### 7.7 ConsultationEvent

Co the reuse AuditLog, nhung neu can room timeline:

- `id`
- `consultationId`
- `actorUserId`
- `eventType`
- `metadataJson`
- `createdAt`

Khuyen nghi MVP: ghi ca AuditLog va ConsultationMessage type SYSTEM cho timeline hien UI.

## 8. Public share security

### 8.1 Token policy

- Token raw random >= 32 bytes.
- Store only hash.
- URL dang `/share/[token]` hoac `/s/[shortCode]?t=...`.
- Khong dua patient name/accession/study UID vao URL.
- Copy link UI chi hien raw token ngay sau create; sau reload chi co nut regenerate/new link.

### 8.2 Password policy

- Password optional.
- Neu bat password, public route dau tien hien password gate.
- Failed attempts tang counter.
- Qua threshold -> `LOCKED` optional.
- Password failed/pass events logged.

### 8.3 Expiry/revoke

- Expired/revoked link tra UI ro: "Link da het han" / "Link da bi thu hoi".
- Public route khong tiet lo case co ton tai hay khong.
- Revoke can reason optional/required theo policy.

### 8.4 Hide patient info

Khi `hidePatientInfo=true`:

- Public UI mask patientName, patientId, dob, phone.
- DICOM overlay/patient tags khong hien.
- Report text can can than: neu report body chua PHI trong free text, UI can warning "Report text may contain patient-identifying details".
- Filename export neu co khong chua PHI.

### 8.5 Public viewer scope

Public viewer:

- Read-only.
- No report edit.
- No upload/capture.
- No delete.
- No HIS action.
- No internal route links.
- No raw Orthanc URL exposed.
- No direct file path.

## 9. Workflow chi tiet - Share

### 9.1 Tao share link

Entry points:

- Study List row menu.
- Report detail toolbar.
- Archive row action.
- Non-DICOM capture/detail page.
- Viewer action menu if current study context exists.

Dialog fields:

- Scope: study/report/media selected/viewer artifacts.
- Expiry: 1 day, 3 days, 7 days, custom.
- Password optional.
- Hide patient info toggle.
- Allow report toggle.
- Allow images toggle.
- Allow download toggle default off.
- Selected media/artifacts if applicable.

After create:

- Show protected link.
- Copy button.
- QR code.
- Expiry/status badge.
- Warning if patient info not hidden.

Server:

- Permission `share.create`.
- Validate scope exists.
- Validate report final if sharing report externally, unless policy allows draft internal.
- Create AuditLog `share_link_created`.
- Return raw token once.

### 9.2 Quan ly share links

UI:

- List active/revoked/expired links for current case.
- Columns: status, scope, expiry, created by, access count, last accessed, hide patient info, download allowed.
- Actions: copy link if raw token still available? If not, show "create new link"; revoke; view logs; extend expiry if policy allows.

Server:

- Permission `share.read`.
- Revoke requires `share.revoke` or creator/admin policy.

### 9.3 Public share viewer

Route de xuat:

```text
dashboard/app/share/[token]/page.tsx
dashboard/app/api/share/[token]/context/route.ts
dashboard/app/api/share/[token]/media/[mediaId]/route.ts
```

UI:

- Password gate if needed.
- Expired/revoked/locked empty state.
- Header with masked or visible patient/case summary.
- Tabs:
  - Images/media.
  - Report.
  - Measurements/key images/snapshots if allowed.
  - Access info/expiry.
- QR/open on mobile friendly layout.
- No sidebar internal admin links.

### 9.4 Access audit

Events:

- `share_opened`
- `share_password_failed`
- `share_password_passed`
- `share_report_viewed`
- `share_media_viewed`
- `share_download_denied`
- `share_revoked`
- `share_expired_denied`

UI:

- Internal share dialog shows access log.
- Public UI never shows audit metadata.

## 10. Workflow chi tiet - Consultation

### 10.1 Create consultation request

Entry points:

- Study List row action.
- Report detail.
- Archive row action.
- Non-DICOM detail.
- Viewer action menu.

Dialog fields:

- Title.
- Reason.
- Priority.
- Host/assigned doctor.
- Participants internal users.
- Include report? include images? include Non-DICOM media?
- Need video? toggle.

Server:

- Permission `consult.create`.
- Validate source case.
- Create consultation, participants, system message, AuditLog.

### 10.2 Consultation queue

Route:

```text
dashboard/app/consultations/page.tsx
dashboard/app/consultations/actions.ts
```

Columns:

- Consult code/title.
- Source: DICOM/Non-DICOM/report/archive.
- Patient/case summary with PHI according to internal permission.
- Status.
- Priority.
- Host.
- Participants count.
- Created time/SLA.
- Last message/activity.
- Actions: open room, start, finish, cancel.

Filters:

- Status.
- Priority.
- Mine/all.
- Source type.
- Doctor/host.
- Date preset.
- Search patient/accession/case code/consult code.

### 10.3 Consultation room

Route:

```text
dashboard/app/consultations/[id]/page.tsx
dashboard/app/api/consultations/[id]/messages/route.ts
dashboard/app/api/consultations/[id]/participants/route.ts
```

Layout:

- Header: status, priority, source case, buttons start/finish/cancel.
- Left/center: case summary + embedded read-only viewer/media/report tabs.
- Right: participants + chat.
- Bottom/activity: system timeline.

Actions:

- Start room.
- Join/leave.
- Add participant.
- Remove participant.
- Send message.
- Finish.
- Cancel with reason.

Server:

- All actions check membership + permission.
- Admin override only with `consult.admin`.

### 10.4 Video provider boundary

MVP options:

1. No video provider configured:
   - UI shows "Video chua cau hinh".
   - Chat/lifecycle still works.
   - `providerStatus=DISABLED`.

2. External provider configured:
   - Store provider room ID and internal join URL.
   - Do not expose provider secret.
   - Audit room created/join opened.

Do not implement raw WebRTC/TURN production in this phase unless deployment spec exists.

## 11. Integration voi cac man hinh san co

### 11.1 Study List `/`

Add row action:

- Share.
- Request consultation.

Add badges/fields:

- Active share count.
- Active consultation count.

Detail panel:

- Latest share status.
- Latest consultation status.

### 11.2 Report detail `/report/[studyInstanceUid]`

Add:

- Share final report button.
- Share viewer artifacts/media selected.
- Request consultation.
- Consultation history panel.

Guard:

- Draft report sharing disabled or internal-only warning.
- Final report share allowed by permission.

### 11.3 Archive `/archive`

Add:

- Share/revoke/share logs.
- Request consultation.
- Active share/consult badges.

### 11.4 Non-DICOM `/non-dicom/[id]`

Add:

- Share gallery/report/media selected.
- Request consultation.
- Active share/consult badges.

### 11.5 Viewer

Add or map:

- Tool/action `Share`.
- Tool/action `Consult`.
- If not ready in OHIF command bridge, keep button disabled with reason; dashboard routes must still work.

### 11.6 Statistics

Add small cards if scope allows:

- Active share links.
- Expired/revoked share count.
- Active consultations.
- Consultation response time.
- Finished/cancelled consultations.

## 12. API va service boundaries

### 12.1 Services

Files de xuat:

```text
dashboard/lib/shareService.ts
dashboard/lib/shareTokenService.ts
dashboard/lib/shareAccessService.ts
dashboard/lib/consultationService.ts
dashboard/lib/consultationPermissionService.ts
dashboard/lib/videoProviderService.ts
```

Responsibilities:

- Token generation/hash/verify.
- Share lifecycle: create/revoke/expire/lock.
- Public context assembly with masking.
- Consultation lifecycle.
- Participant membership checks.
- Chat message append.
- Audit.

### 12.2 Internal server actions

```text
dashboard/app/share/actions.ts
dashboard/app/consultations/actions.ts
dashboard/app/report/[studyInstanceUid]/share-actions.ts
dashboard/app/non-dicom/[id]/share-actions.ts
```

### 12.3 Public API routes

```text
dashboard/app/share/[token]/page.tsx
dashboard/app/api/share/[token]/context/route.ts
dashboard/app/api/share/[token]/password/route.ts
dashboard/app/api/share/[token]/media/[mediaId]/route.ts
```

### 12.4 Consultation API routes

```text
dashboard/app/api/consultations/[id]/messages/route.ts
dashboard/app/api/consultations/[id]/participants/route.ts
dashboard/app/api/consultations/[id]/start/route.ts
dashboard/app/api/consultations/[id]/finish/route.ts
dashboard/app/api/consultations/[id]/cancel/route.ts
```

## 13. PR breakdown de xuat

### PR 7.1 - Schema, permissions, services skeleton

Scope:

- Add ShareLink, ShareAccessLog, ShareMediaSelection.
- Add Consultation, ConsultationParticipant, ConsultationMessage/Event.
- Add permissions and seed/seed.js.
- Add migration.
- Add basic service functions.

UI bat buoc:

- Permission labels show in admin/role UI.
- Sidebar Consultation entry visible for allowed users.
- Share/Consult disabled placeholder if services not wired yet.

### PR 7.2 - Share dialog internal UI

Scope:

- Shared `ShareDialog` component.
- Create link from Study List, Report detail, Archive, Non-DICOM.
- Link list/revoke/access log.
- QR rendering.

Exit:

- Internal user can create/revoke a share link and see it in UI.

### PR 7.3 - Public share viewer

Scope:

- `/share/[token]` route.
- Password gate.
- Expired/revoked/locked states.
- Hide patient info.
- Read-only report/media/images.
- Access audit.

Exit:

- Public link opens scoped content without internal session and cannot mutate data.

### PR 7.4 - Consultation queue and create request

Scope:

- `/consultations` route.
- Create consultation dialog from Study/Report/Archive/Non-DICOM.
- Queue filters.
- Participants internal user selection.
- Status badges on source screens.

Exit:

- User can request consultation and find it in queue.

### PR 7.5 - Consultation room, chat, lifecycle

Scope:

- `/consultations/[id]` room.
- Participant list.
- Chat MVP.
- Start/finish/cancel.
- System timeline.
- Provider disabled/ready state.

Exit:

- Consultation can move requested -> started/in-progress -> finished or cancelled.

### PR 7.6 - Viewer hooks and operational visibility

Scope:

- Viewer action entries for Share/Consult if command bridge can open dashboard dialog/route.
- Study List/Report/Archive/Non-DICOM active share/consult counts.
- Statistics cards.

Exit:

- All Phase 7 data appears on operational UI.

### PR 7.7 - Security, QA, regression

Scope:

- Public route security review.
- Password/expiry/revoke tests.
- Permission bypass tests.
- Hide patient info tests.
- Consultation membership tests.
- Build and manual QA.

## 14. QA scenarios

### SCN-7.1 Create share link

1. Login as doctor.
2. Open final report or study row.
3. Create share link with expiry 1 day, password on, hide patient info on.
4. Copy link and open incognito/public session.

Expected:

- Password gate appears.
- After password, content visible read-only.
- Patient identity masked.
- Access log created.

### SCN-7.2 Expired/revoked share

1. Create share.
2. Revoke it.
3. Open public link.

Expected:

- Public route shows revoked state.
- No media/report content leaks.
- Revoke audit exists.

### SCN-7.3 Password failed lock

1. Open password-protected link.
2. Enter wrong password repeatedly.

Expected:

- Failed attempts audited.
- Optional locked state if threshold configured.
- No case existence details leaked.

### SCN-7.4 Share Non-DICOM media

1. Open Non-DICOM case with media.
2. Create share link for selected media.
3. Open public link.

Expected:

- Only selected media visible.
- No upload/delete/finalize buttons.

### SCN-7.5 Create consultation

1. Login as doctor.
2. Create consultation from Study List or Report.
3. Add participant.
4. Open queue.

Expected:

- Consultation appears as REQUESTED.
- Participant invited.
- Source case shows active consultation badge.

### SCN-7.6 Consultation room lifecycle

1. Open consultation room.
2. Start room.
3. Send chat message.
4. Finish consultation.

Expected:

- Status transitions correctly.
- Chat persists.
- Timeline/audit exists.
- Report status unchanged.

### SCN-7.7 Permission bypass

1. User without `share.create` tries direct create action.
2. Non-participant tries to open consultation room/message endpoint.

Expected:

- Backend rejects.
- UI does not show forbidden actions.

## 15. Acceptance criteria

Phase 7 chi duoc coi la hoan thanh khi:

- Share links co expiry, optional password, QR, revoke, access log.
- Public share viewer read-only va scoped.
- Hide patient info works on public UI.
- Share links can be created from Study, Report, Archive, and Non-DICOM where allowed.
- Consultation request/queue/room/chat/lifecycle work.
- Participant membership is enforced server-side.
- Video provider disabled/ready state is visible; no fake video button.
- Active share/consult status visible on operational screens.
- No UI action visible if backend will reject due permission.
- No public route exposes internal file path, Orthanc URL, raw token hash, or PHI in filename.
- Build/type-check pass.
- Manual QA covers expired/revoked/password/public/incognito and consultation lifecycle.

## 16. Rui ro va guardrails

| Rui ro | Giam thieu |
| --- | --- |
| Public link leaks PHI | Token hash, expiry, hide patient info, scoped context, no raw file path |
| Password brute force | Failed attempt counter, optional lock, audit |
| Public route mutates data | Read-only API surface, no internal actions |
| Share report free text still contains PHI | Warning and policy; hide structured fields first |
| Consultation changes clinical workflow accidentally | Do not mutate report/study status |
| Participant bypass | Membership checks on every room/message API |
| Video provider not ready | Disabled state with reason; chat/lifecycle still work |
| UI clutter | Use dialogs/badges, not huge cards in Study List |

## 17. Prompt giao cho AI coding agent

```text
Ban la coding agent trong repo MiniPACS. Hay thuc hien Phase 7 - Sharing And Consultation theo file:

- docs/VRPACS_PHASE7_SHARING_AND_CONSULTATION_PLAN.md

Can doc truoc:

- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_TERMINOLOGY_MAP.md
- docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md
- docs/VRPACS_PHASE6_NON_DICOM_CAPTURE_MODULE_PLAN.md
- dashboard/prisma/schema.prisma
- dashboard/lib/permissions.ts
- dashboard/app/actions.ts
- dashboard/app/page.tsx
- dashboard/app/report/[studyInstanceUid]/page.tsx
- dashboard/app/archive/page.tsx
- dashboard/app/non-dicom/[id]/page.tsx

Muc tieu:

- Implement share links voi expiry, optional password, QR, hide patient info, revoke, access log.
- Implement public share viewer read-only, scoped by token.
- Implement consultation request, queue, room, participants, chat, start/finish/cancel.
- Tat ca schema/service/API/action moi phai co UI hien thi/tuong tac tuong ung.

Rang buoc:

- Token raw khong luu DB; chi luu hash.
- Public route khong expose Orthanc URL/filePath/internal APIs.
- UI khong hien action neu backend se reject.
- Server-side permission va consultation membership la bat buoc.
- Share link phai co expiry.
- Hide patient info phai mask structured patient fields.
- Consultation khong tu dong thay doi report final/study delivery status.
- Khong lam delete/retention/export bulk/native workstation trong Phase 7.
- Khong revert thay doi cua user.

Ket qua mong muon:

- Files changed list.
- Behavior/UI changed summary.
- Build/test da chay.
- Manual scenarios da test.
- Share/consult UI surfaces da hien o dau.
- Rui ro con lai neu co.
```

