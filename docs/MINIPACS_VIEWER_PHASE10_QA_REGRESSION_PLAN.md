# MiniPACS Viewer Phase 10 - QA & Regression Plan

## Muc tieu

Phase 10 la phase khoa nen viewer sau cac thay doi Phase 1 den Phase 9. Khong them feature lon trong phase nay. Muc tieu la kiem thu viewer custom voi ca that, bat loi hoi quy, sua cac bug can thiet va tao QA report de cac phase sau co checklist on dinh.

## Nguyen tac

- Khong them UI/feature moi neu khong bat buoc de sua bug.
- Khong refactor lan rong.
- Khong reset DB.
- Khong xoa volume Docker.
- Khong doi workflow deploy neu khong phuc vu loi QA cu the.
- Neu gap bug lon lien quan kien truc, ghi ro vao QA report va dung de review.

## Pham vi QA

### 1. Route & Worklist

Kiem tra tu dashboard/worklist:

- Double click ca chup phai mo dung viewer custom:
  - `/viewer/minipacs?StudyInstanceUIDs=...`
- Khong duoc quay lai OHIF default route cu:
  - `/viewer/viewer?...`
  - `/viewer/viewer?StudyInstanceUIDs=...`
- Neu thieu `StudyInstanceUIDs`, viewer phai hien loi ro hoac empty state hop ly.
- Neu `StudyInstanceUIDs` sai/khong ton tai, viewer khong duoc den man hinh den im lang.

### 2. Study Loading

Can test toi thieu cac loai ca that co san trong he thong:

- XR/X-quang 1 anh.
- CT nhieu series.
- US/Sieu am multi-frame hoac stack neu co.
- Ca co nhieu series cung modality.
- Ca chua co report.
- Ca da co report.
- Ca chua sync day du metadata trong dashboard DB.

Voi moi ca, ghi lai:

- StudyInstanceUID.
- Modality.
- So series.
- Viewer load thanh cong hay loi.
- Screenshot neu co loi hien thi.

### 3. Viewer Shell

Kiem tra cac thanh phan chinh:

- Header custom.
- Left toolbar.
- Series rail.
- Viewport chinh.
- Overlay thong tin patient/study/image.
- Mini toolbar trong viewport.
- Panels/dialogs cua workflow.

Kiem tra layout o it nhat:

- 1366x768.
- 1920x1080.
- Neu co the, them 1536x864.

Acceptance:

- Khong co man hinh den sau khi study load.
- Khong co text tran khoi button/panel nghiem trong.
- Khong co panel che anh theo cach lam bac si khong thao tac duoc.
- Icon/tool state nhin duoc ro.

### 4. Series Rail

Kiem tra:

- Series list hien dung so luong.
- Thumbnail co kich thuoc on dinh.
- Thumbnail khong lam vo layout.
- Click series doi anh vao viewport active.
- Series dang chon co active state ro.
- CT nhieu series khong mat series.
- US/multi-frame hien thong tin image/frame count neu co.

Neu sort series chua hoan hao thi ghi vao QA report, nhung chi sua trong Phase 10 neu sort sai gay mo nham anh nghiem trong.

### 5. Viewport Tools

Test cac tool da custom/map:

- Pan.
- Zoom.
- Window/Level.
- Reset.
- Invert.
- Rotate.
- Flip.
- Layout 1x1.
- Layout 1x2.
- Layout 2x1.
- Layout 2x2.
- Fullscreen/Restore.
- Cine Play/Pause.
- Stack scroll bang mouse wheel.
- Sync viewport.
- Snapshot/Download modal.

Voi moi tool:

- Click tool co active state dung khong.
- Tool co tac dung tren viewport active khong.
- Tool co lam crash viewer khong.
- Co toast loi hop ly neu backend/API chua ho tro khong.

### 6. Workflow Tools

#### Save Snapshot

Kiem tra:

- Bam Save Snapshot khi co study hop le.
- Chi hien toast thanh cong khi backend save thanh cong.
- Reload Gallery van thay record da luu.
- Record co metadata co ban:
  - studyInstanceUid
  - seriesInstanceUid neu co
  - sopInstanceUid neu co
  - imageIndex/imageCount neu co
  - modality
  - seriesDescription

#### Key Image

Kiem tra:

- Bam Key Image mo dialog note.
- Luu note thanh cong.
- API list key-images tra record moi.
- Note duoc trim/gioi han do dai theo Phase 9.
- Khong crash neu viewport khong co Study UID.

#### History

Kiem tra:

- Mo History panel.
- Neu co ca cung patient thi hien list dung.
- Neu khong co history thi empty state ro rang.
- Loi API phai hien message ro, khong lam crash viewer.

#### Report

Kiem tra:

- Chua login: hien toast can dang nhap/unauthorized, khong redirect im lang.
- Login nhung thieu quyen: hien toast khong co quyen.
- Co quyen: mo report dung study.
- Khong co report: message hop ly, khong crash.

### 7. Backend/Auth Regression

Sau Phase 9 can kiem tra cac API:

- `GET /api/viewer/studies/[uid]/context`
- `GET /api/viewer/studies/[uid]/history`
- `GET /api/viewer/snapshots?studyInstanceUid=...`
- `POST /api/viewer/snapshots`
- `GET /api/viewer/studies/[uid]/key-images`
- `POST /api/viewer/studies/[uid]/key-images`
- `GET /api/viewer/studies/[uid]/report-link`
- `POST /api/audit/viewer-action`

Acceptance:

- Chua login tra `401`.
- Login nhung thieu quyen tra `403`.
- Login co quyen hop le thi API chay duoc.
- API khong redirect ve `/login`.
- Error body co `message` hoac `error` de viewer hien toast dung.

### 8. Audit Log

Kiem tra DB/API ghi duoc cac action:

- `viewer_opened`
- `snapshot_saved`
- `key_image_saved`
- `history_opened`
- `report_opened`
- `download_opened`
- `tool_used` hoac `TOOL_CLICK_*` neu van giu click audit.

Acceptance:

- Audit failure khong crash viewer.
- Cac action thanh cong moi ghi semantic action thanh cong.
- `actorUserId` co gia tri khi user login.

### 9. Docker/Update Regression

Kiem tra:

- `docker-compose.yml` khong expose Postgres mac dinh bang `5432:5432`.
- `sudo bash ./update.sh` khong xoa DB/volume.
- Update khong lam mat study da co.
- Update khong lam mat snapshot/key image da luu.
- Neu dung `prisma migrate deploy`, phai xu ly case DB da tung duoc `db push` o Phase 8.

Acceptance:

- Khong co reset volume.
- Khong co lenh destructive.
- Schema update an toan voi DB dang co du lieu.

## Build Bat Buoc

Chay cac lenh:

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

Neu build fail:

- Sua bug build neu nam trong scope QA.
- Ghi ro loi va file lien quan vao QA report.
- Khong bo qua build fail.

## QA Report

Tao file:

```text
docs/MINIPACS_VIEWER_PHASE10_QA_REPORT.md
```

Report can co cac muc:

1. Tong quan ket qua.
2. Moi truong test:
   - Ngay test.
   - Branch/commit.
   - URL dashboard/viewer.
   - Browser.
3. Danh sach ca da test:
   - StudyInstanceUID.
   - Modality.
   - Mo ta.
   - Ket qua.
4. Checklist pass/fail:
   - Route/worklist.
   - Study loading.
   - Viewer shell.
   - Series rail.
   - Viewport tools.
   - Workflow tools.
   - API auth.
   - Audit log.
   - Docker/update.
5. Bug da sua trong Phase 10.
6. Bug con ton tai.
7. Build results.
8. De xuat Phase 11.

## Bug Fix Scope

Duoc sua trong Phase 10:

- Route mo sai viewer.
- Man hinh den do bug runtime.
- Crash khi click tool.
- API auth tra sai status.
- Toast loi bi mat message.
- Series rail click sai viewport.
- Overlay/toolbar che het viewport.
- Build fail do loi TypeScript/import.

Khong nen lam trong Phase 10:

- Them annotation persistence day du.
- Them hanging protocol moi.
- Viet lai series sorting lon.
- Them MPR/MIP moi.
- Redesign toan bo UI.
- Doi database schema lon ngoai bug Phase 9.

## Acceptance Criteria Tong

Phase 10 coi la xong khi:

- Viewer custom mo dung route `/viewer/minipacs`.
- Khong con man hinh den voi cac ca test chinh.
- Test duoc it nhat XR va CT; them US/multi-frame neu co data.
- Cac tool chinh khong crash.
- Snapshot/key image/history/report khong crash.
- API auth co `401/403` dung.
- Audit action chinh duoc ghi.
- Build pass dashboard, extension va mode.
- Co file `docs/MINIPACS_VIEWER_PHASE10_QA_REPORT.md`.

## Prompt Cho AI Code Phase 10

```text
Hay thuc hien Phase 10: Viewer QA & Regression cho MiniPACS theo file:
docs/MINIPACS_VIEWER_PHASE10_QA_REGRESSION_PLAN.md

Muc tieu:
- Khong them feature lon.
- Chi kiem thu, bat loi hoi quy, sua bug can thiet va viet QA report.
- Tap trung viewer custom /viewer/minipacs.

Viec can lam:
1. Doc ky file Phase 10 plan.
2. Kiem tra route double click tu dashboard/worklist co mo dung /viewer/minipacs?StudyInstanceUIDs=...
3. Test viewer voi ca that co san: XR, CT nhieu series, US/multi-frame neu co.
4. Test Viewer Shell: header, left toolbar, series rail, viewport, overlay, mini toolbar.
5. Test Series Rail: list series, thumbnail, active state, click series vao viewport active.
6. Test Viewport Tools: pan, zoom, window/level, reset, invert, rotate/flip, layout, fullscreen/restore, cine, stack scroll, sync, download.
7. Test Workflow Tools: snapshot, key image, history, report.
8. Test API auth sau Phase 9:
   - Chua login phai 401.
   - Login thieu quyen phai 403.
   - Co quyen phai chay duoc.
9. Test audit log cho cac action chinh:
   - viewer_opened
   - snapshot_saved
   - key_image_saved
   - history_opened
   - report_opened
   - download_opened
10. Kiem tra docker-compose.yml khong expose Postgres 5432:5432.
11. Kiem tra update.sh khong co logic co nguy co lam mat du lieu.
12. Neu phat hien bug nho trong scope QA thi sua.
13. Neu phat hien bug lon anh huong kien truc thi ghi vao report va dung de review.
14. Chay build:
    - cd dashboard && npm run build
    - cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
    - cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
15. Tao file docs/MINIPACS_VIEWER_PHASE10_QA_REPORT.md ghi:
    - Moi truong test.
    - Cac StudyInstanceUID da test.
    - Checklist pass/fail.
    - Bug da sua.
    - Bug con ton tai.
    - Ket qua build.

Rang buoc:
- Khong reset DB.
- Khong xoa Docker volume.
- Khong chay destructive command.
- Khong refactor lan rong.
- Khong them feature moi ngoai bug fix can thiet.
- Bao cao ro file da sua va ly do sua.
```
