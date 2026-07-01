# MiniPACS Viewer Phase 8: Backend Integration & Persistence

## Context

Phase 8 bat dau voi gia dinh rang Phase 7 da duoc sua dung: viewer custom da load dung route, series rail/layout/toolbar khong con duplicate nghiem trong, mini toolbar/overflow da render, va cac workflow controls co the thao tac tren viewer.

Muc tieu cua Phase 8 la bien cac workflow dang mock thanh backend that co persistence: Snapshot, Key Image, History, Report Link, Study Context va Audit.

## Goal

Viewer khong con tra mock data cho cac workflow chinh. Moi thao tac quan trong cua bac si trong viewer phai co du lieu that, co the reload/restart ma khong mat, va co thong bao loi ro rang neu backend/auth chua san sang.

## Non-Goals

- Khong custom them UI lon neu khong can cho backend workflow.
- Khong doi docker volume/storage neu khong co migration du lieu ro rang.
- Khong viet lai viewer mode hoac refactor ngoai pham vi Phase 8.
- Khong them du lieu fake de lam UI "co ve dung".

## Work Items

### 1. Database Models

Them Prisma models phuc vu viewer workflow:

- `ViewerSnapshot`
- `ViewerKeyImage`
- `ViewerAuditLog`

Field toi thieu nen co:

- `id`
- `studyInstanceUid`
- `seriesInstanceUid`
- `sopInstanceUid`
- `frameNumber`
- `displaySetInstanceUID`
- `viewportId`
- `imageIndex`
- `imageCount`
- `windowWidth`
- `windowCenter`
- `zoom`
- `modality`
- `bodyPartExamined`
- `seriesDescription`
- `note`
- `viewportState` dang JSON de luu payload bo sung
- `createdByUserId` neu co session
- `createdAt`
- `updatedAt` neu can

Sau khi them model:

- Tao Prisma migration.
- Chay generate client.
- Kiem tra build dashboard khong loi type.

### 2. Replace Mock Viewer APIs

Thay toan bo mock API bang logic that:

- `GET /api/viewer/snapshots`
- `POST /api/viewer/snapshots`
- `GET /api/viewer/studies/[uid]/key-images`
- `POST /api/viewer/studies/[uid]/key-images`
- `DELETE /api/viewer/studies/[uid]/key-images/[id]` neu can xoa key image
- `GET /api/viewer/studies/[uid]/history`
- `GET /api/viewer/studies/[uid]/context`
- `GET /api/viewer/studies/[uid]/report-link`
- `POST /api/audit/viewer-action`

Nguyen tac:

- Khong tra mock data.
- Neu chua co data that thi tra empty array/object hop le.
- Loi backend phai tra status code va message ro rang.
- Khong `console.log('[Mock API] ...')` trong code phase 8.

### 3. Snapshot Persistence

Khi user bam `Save Snapshot`:

- Lay metadata tu viewport hien tai.
- Goi `POST /api/viewer/snapshots`.
- Luu vao DB.
- Tra ve record vua tao.
- Toast thanh cong chi hien khi backend save thanh cong.

Khi mo Gallery:

- Goi `GET /api/viewer/snapshots?studyInstanceUid=...`.
- Hien record that tu DB.
- Neu chua co preview image thi hien metadata card ro rang, khong hien fake preview.

Chap nhan trong Phase 8:

- Chua bat buoc generate thumbnail pixel that.
- Nhung record snapshot phai la du lieu that va ton tai sau reload.

### 4. Key Image Persistence

Khi user bam `Key Image`:

- Mo dialog note.
- Luu metadata viewport + note vao `ViewerKeyImage`.
- Audit chi ghi sau khi luu thanh cong.
- Cho phep doc lai danh sach key images theo study.

Neu UI chua co danh sach key image rieng, Phase 8 toi thieu phai co API get/list de phase sau dung.

### 5. Real Study History

`GET /api/viewer/studies/[uid]/history` phai tra cac ca that cua cung benh nhan.

Luon thu tu:

1. Tim study hien tai theo `StudyInstanceUID` trong DB/Orthanc.
2. Lay `PatientID`.
3. Query cac study cung `PatientID`.
4. Loai study hien tai.
5. Sort theo ngay chup moi nhat truoc.
6. Kem `reportUrl` neu co report tuong ung.

Neu khong tim thay patient/study:

- Tra `[]`.
- Khong tra fake CT/MR mau.

### 6. Real Study Context

`GET /api/viewer/studies/[uid]/context` phai tra thong tin that:

- patientName
- patientId
- accessionNumber
- studyDate
- studyDescription
- modality
- studyStatus
- reportStatus
- assignedDoctor neu co
- previousStudyCount

Nguon du lieu uu tien:

1. DB dashboard/RIS neu da sync.
2. Orthanc metadata neu DB chua co.
3. Empty/null field hop le neu that su khong co.

### 7. Report Link & Auth Handling

`GET /api/viewer/studies/[uid]/report-link` phai:

- Tra `/report/[studyInstanceUid]` neu user co quyen xem/viet report.
- Neu chua login, tra `401` voi message ro rang.
- Neu khong co quyen, tra `403`.

`viewerReportBridge` phai:

- Khong de viewer roi vao `/login` mot cach im lang.
- Neu API tra 401, hien toast: "Can dang nhap Dashboard de mo bao cao."
- Neu API tra 403, hien toast: "Ban khong co quyen mo bao cao."
- Neu thanh cong, open report url cung origin.

### 8. Audit Log

`POST /api/audit/viewer-action` phai ghi DB that vao `ViewerAuditLog`.

Actions toi thieu:

- `viewer_opened`
- `tool_used`
- `layout_changed`
- `series_selected`
- `viewport_changed`
- `snapshot_saved`
- `key_image_saved`
- `history_opened`
- `report_opened`
- `download_opened`

Payload nen gom:

- `studyInstanceUid`
- `seriesInstanceUid`
- `sopInstanceUid`
- `viewportId`
- `action`
- `metadata`
- `userId` neu co session
- `createdAt`

Audit failure khong duoc crash viewer; chi log server-side va co the tra warning neu can.

### 9. UI Copy & Error States

Xoa/doi toan bo copy:

- `Mock Backend`
- `Mock API`
- data mau fake

Thong bao UI nen ro:

- "Da luu Snapshot."
- "Khong luu duoc Snapshot."
- "Da luu Key Image."
- "Khong tai duoc lich su kham."
- "Can dang nhap Dashboard de mo bao cao."

Empty state phai phan biet:

- Khong co du lieu.
- Backend loi.
- Chua dang nhap/chua co quyen.

### 10. Docker/Data Safety

Khong duoc doi cac mount du lieu dang chay tu bind mount sang named volume neu khong co migration.

Can dac biet tranh cac thay doi co the lam mat ca chup dang co:

- `./pacs_data/postgres:/var/lib/postgresql/data`
- `./pacs_data/orthanc:/var/lib/orthanc/db`
- `./pacs_data/worklists:/worklists`
- `./pacs_data/report_images:/app/pacs_data/report_images`

Neu muon doi volume:

- Phai co migration script.
- Phai co huong dan backup/restore.
- Phai duoc confirm rieng.

## Verification Checklist

Code-level:

- `rg "Mock|mock|Mock Backend|Mock API" dashboard/app/api ohif-viewer/extensions/minipacs/src` khong con trong workflow phase 8, tru cac comment changelog neu co.
- Prisma migration duoc commit.
- Prisma client generate thanh cong.
- Khong co debug script tam `.cjs/.js` bi them vao root repo.

Build:

- `npm run build` trong `dashboard`
- `npm run build --workspace=@ohif/extension-minipacs` trong `ohif-viewer`
- `npm run build --workspace=@ohif/mode-minipacs-viewer` trong `ohif-viewer`

Runtime:

- Mo viewer voi 1 study CT that.
- Console khong co runtime error.
- Series rail van co series.
- Save Snapshot xong reload viewer, Gallery van thay record vua luu.
- Save Key Image xong API list tra record vua luu.
- History tra dung cac study cung PatientID, khong fake.
- Report click:
  - Neu da login va co quyen: mo `/report/[uid]`.
  - Neu chua login: hien toast login, khong redirect im lang.
  - Neu khong co quyen: hien toast permission.
- Docker restart khong lam mat ca chup/DB cu.

## Handoff Prompt

```text
Tiep tuc Phase 8: Viewer Backend Integration & Persistence.

Gia dinh Phase 7 da fix dung: viewer custom load duoc, toolbar/sidebar/series rail/mini toolbar khong con duplicate runtime nghiem trong.

Muc tieu Phase 8:
- Xoa mock backend cua viewer workflow.
- Luu/lay du lieu that cho Snapshot, Key Image, History, Context, Report Link, Audit.
- Khong lam mat du lieu PACS hien co.

Yeu cau chi tiet:
1. Them Prisma models ViewerSnapshot, ViewerKeyImage, ViewerAuditLog va migration tuong ung.
2. Sua API:
   - GET/POST /api/viewer/snapshots
   - GET/POST /api/viewer/studies/[uid]/key-images
   - GET /api/viewer/studies/[uid]/history
   - GET /api/viewer/studies/[uid]/context
   - GET /api/viewer/studies/[uid]/report-link
   - POST /api/audit/viewer-action
3. Khong tra mock data nua. Neu chua co data that thi tra empty state dung.
4. Snapshot/Key Image phai luu metadata viewport that: Study/Series/SOP/frame/imageIndex/window/level/zoom/displaySetInstanceUID/note.
5. History phai query cac study cung PatientID tu DB/Orthanc, khong fake CT/MR.
6. Report link phai xu ly auth/quyen ro rang: 401/403 co message, viewer hien toast, khong redirect im lang sang /login.
7. Audit phai ghi DB that nhung khong duoc crash viewer neu audit fail.
8. Xoa copy "Mock Backend", "Mock API" khoi UI/API workflow.
9. Tuyet doi khong doi docker volume/storage neu khong co migration du lieu va confirm rieng.
10. Don sach debug script tam, khong commit file check_*.cjs/test_*.cjs/log dump vao root repo.

Sau khi xong, chay build dashboard + ohif extension + ohif mode, va test runtime tren viewer:
- Anh van load.
- Series rail co series.
- Save Snapshot -> reload -> Gallery van co record.
- Key Image save thanh cong.
- History dung patient.
- Report auth behavior dung.
- Console khong co runtime error.

Khong refactor ngoai pham vi Phase 8.
```
