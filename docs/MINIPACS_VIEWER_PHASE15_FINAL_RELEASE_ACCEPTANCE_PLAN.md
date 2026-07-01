# MiniPACS Viewer Phase 15 - Final Release Readiness, Runtime QA & Clinical Acceptance Plan

## Muc tieu

Phase 15 la phase cuoi de dong goi viewer custom `/viewer/minipacs` thanh mot ban co the dua vao su dung noi bo on dinh.

Sau phase nay, viewer phai:

- Khong con rui ro quay lai OHIF default route khi mo ca tu dashboard.
- Khong bi man hinh den im lang khi API, DICOMweb, auth hoac viewport command loi.
- Tat ca tool custom tu Phase 1 den Phase 14 co trang thai ro: dung duoc, disabled co ly do, hoac defer co thong bao.
- Co runtime QA thuc te tren XR/CT/US/MR neu data co san.
- Co checklist release ro rang cho nguoi deploy.
- Co QA report cuoi cung ghi ro pass/fail/known limitations.
- Co handoff prompt ngan gon de AI khac hoac dev khac tiep tuc bao tri.

Day khong phai phase them tinh nang lon. Day la phase chot ha: sua loi tich hop, them guard nho, them diagnostics can thiet, va xac nhan viewer dang hoat dong nhu mot workstation custom co the tin cay.

## Dieu kien tien quyet

Truoc khi lam Phase 15, can dam bao:

- Phase 14 da duoc review va sua cac loi can thiet, dac biet:
  - DICOM SR deferred khong duoc hien success ao.
  - `viewerApiClient` giu duoc error JSON body neu client can doc `status`, `requiresAddendum`, `success`.
  - Report workspace khong bi HTML injection.
  - Measurement/key image section khong duplicate khi gui lai tu UI.
- Build hien tai pass:
  - `dashboard`
  - `@ohif/extension-minipacs`
  - `@ohif/mode-minipacs-viewer`
- Co it nhat mot study XR va mot study CT de test.
- Neu co data US/MR thi dua vao QA, neu khong co thi ghi ro la chua test runtime.
- Docker local chay duoc qua `sudo bash ./update.sh` hoac `docker compose up -d --build ohif dashboard`.

## Vi sao can Phase 15

Tu Phase 1 den Phase 14, viewer da co rat nhieu lop custom:

- Dashboard route vao viewer custom.
- Series rail.
- Viewport overlay.
- Workflow toolbar.
- Snapshot/key image/history/report bridge.
- Measurement persistence.
- Layout preset/hanging protocol.
- MPR/MIP/volume workflow.
- Report workspace va DICOM SR readiness.

Moi phase rieng le co the build pass, nhung release that su can kiem tra theo luong nguoi dung:

1. Mo danh sach ca chup.
2. Double click vao ca.
3. Viewer load dung route custom.
4. Anh hien dung.
5. Series rail sap xep dung.
6. Tool hoat dong dung.
7. Measurement/snapshot/report khong gay loi.
8. Thoat/refresh/mo lai khong mat state bat thuong.
9. Deploy/update khong lam mat DB va khong can thao tac tay lap lai.

Phase 15 gom nhung viec do vao mot release gate duy nhat.

## Nguyen tac

- Khong them tinh nang lon neu khong can cho release.
- Khong refactor rong.
- Khong sua DICOM clinical data theo cach fake/khong chuan.
- Moi loi runtime phai co thong bao ro, khong de blank/black screen im lang.
- Disabled tool phai co ly do, khong de nut bam khong phan hoi.
- Build pass chua du; phai co runtime QA tren browser.
- Neu khong test duoc case nao, ghi ro vao QA report.
- Khong xoa hoac revert thay doi nguoi khac neu khong duoc yeu cau.
- Khong de log/debug console lo PHI/PII khong can thiet.
- Khong expose DB port public trong compose production.

## Scope

### In scope

- Final route verification tu dashboard sang `/viewer/minipacs`.
- Final toolbar/tool registry audit.
- Final error-handling audit cho viewer API client.
- Viewer diagnostics nho de kiem tra ket noi backend/DICOMweb/report API.
- Runtime QA checklist cho XR/CT/US/MR.
- Regression QA cho Phase 1 den Phase 14.
- Release checklist cho `update.sh`, docker compose, env vars.
- Final QA report va known limitations.
- Prompt handoff cho AI/dev tiep theo.

### Out of scope

- Viet lai report editor.
- Full DICOM SR authoring neu metadata chua du.
- HL7/FHIR outbound production integration.
- PACS archive routing nang cao.
- Multi-user realtime collaboration.
- AI diagnosis/report generation.
- Thay doi UI lon ngoai viec sua bug/hardening.

## 1. Inspect Current State Before Coding

Truoc khi sua bat cu file nao, phai inspect:

```text
dashboard/app/worklist/page.tsx
dashboard/app/archive/page.tsx
dashboard/app/api/viewer/**
dashboard/lib/api-auth.ts
dashboard/lib/viewer-measurement-summary.ts
dashboard/prisma/schema.prisma
docker-compose.yml
update.sh
ohif-viewer/extensions/minipacs/src/**
ohif-viewer/modes/minipacs-viewer/src/**
config/app-config.js
config/nginx.conf
```

Can xac nhan:

- Tat ca route mo viewer deu tro ve `/viewer/minipacs?StudyInstanceUIDs=...`.
- Khong con route mac dinh `/viewer/viewer?...` trong dashboard neu khong co ly do fallback.
- `viewerApiClient` tra du error data cho cac API can doc response body.
- `minipacsToolRegistry` khong con command raw bypass guard voi MPR/Crosshairs/report/snapshot.
- Toolbar khong con placeholder action khong co feedback.
- `update.sh` khong reset DB va khong yeu cau thao tac tay lap lai.

## 2. Fix Remaining Phase 14 Error Contract

Neu chua sua, phai sua ngay:

```text
ohif-viewer/extensions/minipacs/src/services/viewerApiClient.ts
```

Yeu cau:

- Khi HTTP non-2xx, van parse JSON body neu co.
- Return shape phai giu du:

```ts
{
  ok: false,
  message: string,
  status: number,
  data?: unknown
}
```

- Client nhu `viewerReportWorkspaceService.exportDicomSR()` phai doc duoc:
  - `data.status === 'deferred'`
  - `data.requiresAddendum === true`
  - `data.success === false`

Acceptance:

- DICOM SR deferred khong hien success.
- DICOM SR deferred hien toast/message dung y nghia.
- Final/completed report khi gui measurement/key image hien dung thong bao addendum/deferred, khong bao thanh cong ao.

## 3. Add Viewer Diagnostics Endpoint

Them backend API nho:

```text
GET /api/viewer/diagnostics
```

Muc dich: de viewer hoac dev kiem tra nhanh he thong co san sang khong.

Response goi y:

```ts
type ViewerDiagnosticsResponse = {
  ok: boolean;
  timestamp: string;
  services: {
    auth: {
      ok: boolean;
      userId?: string;
      permissions?: string[];
    };
    database: {
      ok: boolean;
    };
    dicomweb: {
      ok: boolean;
      baseUrl?: string;
      message?: string;
    };
    viewerApi: {
      ok: boolean;
    };
    reportWorkspace: {
      ok: boolean;
      enabled: boolean;
    };
  };
  warnings: string[];
};
```

Quyen:

- User phai login.
- Chi can permission `studies.read`.
- Khong tra secrets/env raw.
- Khong tra PHI.

Implementation goi y:

- Check DB bang query nhe, vi du count user/report voi timeout hop ly.
- Check config DICOMweb co ton tai, khong can fetch study that.
- Neu fetch DICOMweb thi chi call endpoint metadata/system nhe, co timeout ngan.
- Neu service fail, return `ok: false` nhung HTTP co the la 200 neu diagnostics chay thanh cong va gom du status noi bo.

## 4. Add MiniPACS Viewer Diagnostics Dialog

Them UI action trong overflow/menu hoac settings viewer:

```text
Diagnostics / Kiem tra he thong
```

File goi y:

```text
ohif-viewer/extensions/minipacs/src/services/viewerDiagnosticsService.ts
ohif-viewer/extensions/minipacs/src/Components/MiniPacsDiagnosticsDialog.tsx
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
```

Dialog can hien:

- Auth: OK/Fail.
- Database: OK/Fail.
- DICOMweb config: OK/Fail/Warning.
- Report workspace: OK/Fail.
- Current study UID neu dang co.
- Viewer route: `/viewer/minipacs`.
- Build/runtime version neu lay duoc tu env/package.

Nguyen tac UI:

- Khong hien token, cookie, password, connection string.
- Khong hien ten benh nhan neu khong can.
- Fail service nao phai co message ngan gon.
- Co nut copy diagnostics text da sanitize de gui support.

Acceptance:

- Khi API diagnostics OK, dialog hien tat ca service state.
- Khi API loi 401/403, dialog hien message login/permission ro.
- Khi backend fail, viewer khong crash.

## 5. Tool Registry & Command Final Audit

Lap bang audit trong QA report cho tat ca action tu Phase 1 den 14.

Can kiem tra cac nhom:

### Navigation / Layout

- Back/list.
- Fullscreen/Restore.
- Layout presets.
- Auto layout.
- Manual layout override.
- Series rail click/drag/drop neu co.

### Image Tools

- Window/Level.
- Pan.
- Zoom.
- Rotate.
- Flip.
- Invert.
- Reset.
- Stack scroll.
- Cine play/pause.

### Measurement Tools

- Length.
- Angle.
- Bidirectional.
- Rectangle/ROI.
- Ellipse/ROI.
- Probe.
- Arrow/annotation neu co.
- Delete/clear measurement neu co.
- Measurement persistence reload.

### Advanced Workflow

- MPR.
- MPR + 3D/MIP.
- Crosshairs.
- Sync stack.
- Snapshot/download.
- Key image.
- Report workspace.
- Diagnostics.

Yeu cau:

- Moi tool phai co command hop le hoac disabled state ro.
- Khong co nut bam ma khong co phan hoi.
- Tool can guard phai di qua wrapper MiniPACS, khong bypass raw OHIF command.
- Audit action khong duoc lam crash viewer neu API audit fail.

## 6. Runtime QA Matrix

Tao hoac cap nhat file:

```text
docs/MINIPACS_VIEWER_PHASE15_FINAL_QA_REPORT.md
```

QA matrix bat buoc:

| Case | Study type | Required result |
| --- | --- | --- |
| Open from worklist | XR/CT | Opens `/viewer/minipacs` |
| Direct URL refresh | XR/CT | Viewer reloads without blank screen |
| Series rail | CT multi-series | Series sorted and selectable |
| Stack scroll | CT | Image index changes correctly |
| Cine | US/multi-frame if available | Play/pause works or disabled with reason |
| Measurement save/reload | XR/CT | Measurement persists after refresh |
| Snapshot/key image | XR/CT | Save succeeds or shows API error |
| Report workspace | Any report study | Opens, sends selected items, no duplicate section |
| Final report guard | Final/completed report | Requires addendum / no silent overwrite |
| MPR | CT reconstructable | Enters/exits MPR safely |
| MPR guard | XR/single frame | Rejects with toast, no crash |
| Layout presets | XR/CT | Applies and restores expected viewport state |
| Diagnostics | Any login | Shows sanitized service state |
| Permission failure | user without permission if possible | Shows 401/403, no crash |

Neu khong co data/test user cho mot case, ghi:

```text
Not tested - missing runtime data/user
```

Khong duoc ghi PASS khi chua test runtime.

## 7. Browser Runtime Verification

Can dung browser/Playwright hoac in-app browser de verify toi thieu:

- `http://localhost:8080`
- `http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=<XR_UID>`
- `http://localhost:8080/viewer/minipacs?StudyInstanceUIDs=<CT_UID>`

Can chup/ghi nhan:

- Worklist co ca chup.
- Viewer khong blank.
- Series rail co thumbnail/series.
- Viewport co anh.
- Toolbar custom hien.
- Overlay/HUD khong che anh bat thuong.
- Report workspace/diagnostics dialog mo duoc.

Neu khong dung duoc browser automation, phai ghi ro trong QA report va dua manual checklist cho user test.

## 8. Deploy & Update Script Final Check

Inspect va harden:

```text
update.sh
docker-compose.yml
config/nginx.conf
config/app-config.js
```

Yeu cau:

- `sudo bash ./update.sh` phai:
  - Pull code an toan hoac thong bao ro khi local changes block pull.
  - Build `ohif` va `dashboard`.
  - Apply DB schema theo cach da thong nhat cua project.
  - Restart services can thiet.
  - Khong reset DB.
  - Khong expose Postgres public.
  - In ra URL sau khi xong.
  - In ra command debug log khi fail.

Neu script da co logic nay, chi ghi vao QA report. Neu thieu va sua nho duoc thi sua.

Khong sua destructive command neu khong ro.

## 9. Performance & Memory Sanity Check

Khong can toi uu lon, nhung phai kiem tra:

- Mo CT co nhieu series khong lag qua muc bat thuong.
- Doi series lien tuc khong lam viewer crash.
- Vao/thoat MPR 3 lan khong lam viewport blank.
- Refresh viewer khong tao duplicate listener/dialog state.
- Console khong co error lap lai lien tuc.

Neu phat hien performance issue, phan loai:

- P1: crash/blank screen/data sai.
- P2: thao tac cham nhung dung.
- P3: warning/log/UX nho.

Chi sua P1/P2 can thiet trong Phase 15.

## 10. Security & Privacy Final Check

Can verify:

- API viewer yeu cau login.
- API write yeu cau permission dung.
- Error response khong leak stack trace/secrets.
- Diagnostics khong tra token/env secret.
- Audit metadata khong qua lon.
- Report HTML injection da escape.
- Snapshot/key image URL khong expose file tuy tien neu khong auth.
- Browser console khong log PHI khong can thiet.

Neu phat hien loi security P1, phai sua truoc khi pass release.

## 11. Documentation & Handoff

Tao/cap nhat:

```text
docs/MINIPACS_VIEWER_PHASE15_FINAL_QA_REPORT.md
docs/MINIPACS_VIEWER_RELEASE_HANDOFF.md
```

`FINAL_QA_REPORT` can co:

- Build results.
- Runtime test results.
- Study UID da test.
- Browser/OS test.
- Pass/fail matrix.
- Known limitations.
- Open risks.
- Screenshots neu co the.

`RELEASE_HANDOFF` can co:

- Cach deploy:

```bash
sudo bash ./update.sh
```

- Cach rollback o muc an toan:
  - quay lai commit truoc qua git neu co
  - rebuild containers
  - khong reset DB neu chua backup
- Cac route quan trong:
  - `/`
  - `/viewer/minipacs?StudyInstanceUIDs=...`
  - `/api/viewer/diagnostics`
- Cac feature da hoan thanh Phase 1-15.
- Cac limitation con lai:
  - DICOM SR export deferred neu chua implement metadata mapping day du.
  - MPR chi support reconstructable CT/MR.
  - US cine tuy thuoc multi-frame/stack metadata.

## 12. Acceptance Criteria

Phase 15 chi duoc xem la xong khi:

- Build pass:

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

- Runtime viewer pass toi thieu:
  - XR open/view/measurement/report workspace basic.
  - CT open/series rail/stack scroll/layout/MPR guard or MPR success.
- Khong con blank screen im lang o route viewer custom.
- Tat ca P1/P2 tu review Phase 14 da fix hoac ghi ro ly do defer.
- Diagnostics dialog/API khong leak secret/PHI.
- QA report va handoff doc duoc ghi trong `docs`.

## 13. Suggested File Changes

Co the can them/sua:

```text
dashboard/app/api/viewer/diagnostics/route.ts
ohif-viewer/extensions/minipacs/src/services/viewerApiClient.ts
ohif-viewer/extensions/minipacs/src/services/viewerDiagnosticsService.ts
ohif-viewer/extensions/minipacs/src/Components/MiniPacsDiagnosticsDialog.tsx
ohif-viewer/extensions/minipacs/src/services/commandBridge.ts
ohif-viewer/extensions/minipacs/src/config/minipacsToolRegistry.ts
docs/MINIPACS_VIEWER_PHASE15_FINAL_QA_REPORT.md
docs/MINIPACS_VIEWER_RELEASE_HANDOFF.md
```

Neu repo da co component/dialog/service tuong tu, reuse pattern hien co thay vi tao abstraction moi.

## 14. Prompt Cho AI Thuc Thi Phase 15

Copy prompt nay cho AI code tiep:

```text
Ban dang lam tren repo Minipacs-v.2. Hay thuc hien Phase 15 cuoi cung theo file:

docs/MINIPACS_VIEWER_PHASE15_FINAL_RELEASE_ACCEPTANCE_PLAN.md

Muc tieu: dong goi viewer custom /viewer/minipacs thanh ban release noi bo on dinh. Khong them tinh nang lon ngoai scope. Tap trung sua contract loi con sot, diagnostics, runtime QA, release checklist va handoff.

Bat buoc lam theo thu tu:

1. Inspect code hien co truoc khi sua:
   - dashboard/app/worklist/page.tsx
   - dashboard/app/archive/page.tsx
   - dashboard/app/api/viewer/**
   - dashboard/lib/api-auth.ts
   - dashboard/lib/viewer-measurement-summary.ts
   - ohif-viewer/extensions/minipacs/src/**
   - ohif-viewer/modes/minipacs-viewer/src/**
   - update.sh
   - docker-compose.yml

2. Sua remaining Phase 14 error contract neu chua sua:
   - viewerApiClient phai return data/status/message cho non-2xx JSON response.
   - DICOM SR deferred khong duoc success ao va phai hien message dung.

3. Them API GET /api/viewer/diagnostics:
   - login required.
   - studies.read required.
   - khong leak token/secrets/PHI.
   - response gom auth/database/dicomweb/viewerApi/reportWorkspace state.

4. Them Diagnostics dialog/action trong MiniPACS viewer:
   - mo duoc tu overflow/menu hoac settings.
   - hien service state ro rang.
   - co copy sanitized diagnostics text neu hop ly.
   - fail API khong lam crash viewer.

5. Audit tool registry/commands:
   - khong de tool custom bypass wrapper guard.
   - khong de nut bam khong phan hoi.
   - disabled/deferred action phai co toast hoac ly do.

6. Tao docs:
   - docs/MINIPACS_VIEWER_PHASE15_FINAL_QA_REPORT.md
   - docs/MINIPACS_VIEWER_RELEASE_HANDOFF.md

7. Chay build:
   - cd dashboard && npm run build
   - cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
   - cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer

8. Neu co the, runtime test bang browser voi:
   - http://localhost:8080
   - /viewer/minipacs?StudyInstanceUIDs=<XR_UID>
   - /viewer/minipacs?StudyInstanceUIDs=<CT_UID>

Quy tac:
- Khong revert thay doi nguoi khac.
- Khong reset DB.
- Khong expose Postgres public.
- Khong ghi PASS runtime neu chua test that.
- Neu case nao khong co data, ghi Not tested - missing runtime data/user.
- Bao cao cuoi cung phai neu ro file da sua, build result, runtime QA result, known limitations.
```

## 15. Definition Of Done

Phase 15 xong khi co day du:

- Code diagnostics/API neu can.
- Error contract viewer API duoc harden.
- Final QA report.
- Release handoff doc.
- Build pass.
- Runtime QA duoc ghi ro.
- Khong con P1/P2 blocker dang mo cho viewer custom.

Neu van con blocker, khong duoc ghi "hoan tat 100%"; phai ghi ro blocker va cach reproduce.
