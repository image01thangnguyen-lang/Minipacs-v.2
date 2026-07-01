# MiniPACS Viewer Phase 9 - Security, Audit & Production Hardening

## Muc tieu

Phase 9 khong them UI lon nua. Muc tieu la chot cac phan dang anh huong truc tiep toi viec dung that sau Phase 8:

- API viewer khong duoc doc/ghi du lieu benh nhan khi chua login hoac thieu quyen.
- Docker compose mac dinh khong expose Postgres ra ngoai.
- Audit log ghi dung su kien da thanh cong, khong chi ghi click tool.
- Error message tu backend hien ro tren viewer.
- Update/deploy schema an toan hon khi da co Prisma migration.

## Ly do lam Phase 9

Phase 8 da thay mock API bang backend that. Khi backend that da ghi DB, viewer bat dau cham vao du lieu nhay cam nhu study context, history, snapshots, key images va audit. Vi vay cac loi uu tien tiep theo khong phai la giao dien, ma la bao mat va do tin cay khi chay production.

## 1. Khoa bao mat API viewer

Hien tai `dashboard/middleware.ts` exclude toan bo `/api`, nen tung API route phai tu check auth/permission.

### File can xu ly

- `dashboard/app/api/viewer/snapshots/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/key-images/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/context/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/history/route.ts`
- `dashboard/app/api/audit/viewer-action/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/report-link/route.ts` neu can dong bo helper

### Yeu cau permission

- `GET context`: can login va `studies.read`.
- `GET history`: can login va `studies.read`.
- `GET snapshots`: can login va `studies.read`.
- `GET key-images`: can login va `studies.read`.
- `POST snapshots`: can login va `studies.read`; neu muon chat hon co the tao permission moi `viewer.write`.
- `POST key-images`: can login va `studies.read`; neu muon chat hon co the tao permission moi `viewer.write`.
- `POST audit`: toi thieu can login neu audit duoc gan voi user. Neu cho phep anonymous audit thi phai danh dau ro `actorUserId: null` va khong coi day la user hop le.
- `GET report-link`: giu `reports.read`, co the cho `reports.write` cung hop le neu user co quyen viet report.

### Cach lam khuyen nghi

Tao helper dung chung, vi du:

```ts
// dashboard/lib/api-auth.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission, type PermissionKey } from '@/lib/permissions';

export async function requireApiPermission(permission: PermissionKey) {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Ban chua dang nhap.' },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(session.user.role, permission, session.user.permissions)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: 'Ban khong co quyen thuc hien thao tac nay.' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user: session.user };
}
```

Sau do trong API:

```ts
const authz = await requireApiPermission('studies.read');
if (!authz.ok) return authz.response;
```

### Acceptance

- Chua login goi API viewer phai tra `401`.
- Login nhung thieu quyen phai tra `403`.
- API khong redirect ve `/login`.
- User co quyen phai doc/ghi duoc nhu Phase 8.

## 2. Khong expose Postgres trong compose chinh

### File can xu ly

- `docker-compose.yml`

### Viec can lam

Bo khoi service `db`:

```yaml
ports:
  - "5432:5432"
```

Khong publish Postgres mac dinh vi PACS co du lieu nhay cam. Neu can debug tu host, tao file rieng:

```yaml
# docker-compose.dev.yml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"
```

Khi debug moi chay:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Acceptance

- `docker-compose.yml` khong con `5432:5432`.
- Compose chinh chi de cac service noi bo noi chuyen voi Postgres qua network Docker.
- Neu them `docker-compose.dev.yml`, port chi bind `127.0.0.1`.

## 3. Audit dung su kien thanh cong

Hien tai co audit `TOOL_CLICK_*` truoc khi action chay. Phase 9 can bo sung audit semantic sau khi action that su thanh cong.

### Action toi thieu can co

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

### File can xu ly

- `ohif-viewer/extensions/minipacs/src/services/commandBridge.ts`
- `ohif-viewer/extensions/minipacs/src/services/viewerSnapshotService.ts`
- `ohif-viewer/extensions/minipacs/src/services/viewerReportBridge.ts`
- `ohif-viewer/extensions/minipacs/src/Components/MiniPacsKeyImageDialog.tsx`
- `ohif-viewer/extensions/minipacs/src/Components/MiniPacsHistoryPanel.tsx`
- `ohif-viewer/extensions/minipacs/src/Components/MiniPacsSnapshotGallery.tsx`

### Cach lam

Giu audit click neu muon, nhung them audit sau success:

```ts
viewerAuditService.recordAction(studyUid, 'snapshot_saved', {
  viewportId,
  seriesInstanceUid,
  sopInstanceUid,
  imageIndex,
  imageCount,
});
```

Voi report:

- Chi ghi `report_opened` sau khi API `report-link` thanh cong va co `url`.
- Neu API tra `401/403`, chi show toast, khong ghi thanh cong.

Voi download:

- Ghi `download_opened` sau khi goi command `showDownloadViewportModal`.

### Acceptance

- Save Snapshot thanh cong thi DB co audit `snapshot_saved`.
- Save Key Image thanh cong thi DB co audit `key_image_saved`.
- Mo Report thanh cong thi DB co audit `report_opened`.
- Mo Download modal thanh cong thi DB co audit `download_opened`.
- Audit failure khong crash viewer.

## 4. Validate payload truoc khi ghi DB

### File can xu ly

- `dashboard/app/api/viewer/snapshots/route.ts`
- `dashboard/app/api/viewer/studies/[uid]/key-images/route.ts`
- `dashboard/app/api/audit/viewer-action/route.ts`

### Yeu cau

- Khong ghi truc tiep `data.xxx` vao DB ma khong validate.
- Parse number an toan, khong de `NaN`.
- Gioi han do dai `note`.
- Gioi han do dai `action`.
- Gioi han kich thuoc `metadata`.
- `studyInstanceUid` trong body phai hop le.
- Voi route co `[uid]`, du lieu ghi phai dung `params.uid`, khong cho client ghi sang study khac.

### Helper goi y

```ts
function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function trimOptionalString(value: unknown, maxLength = 500) {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}
```

Neu project chap nhan them dependency, co the dung `zod`; neu khong, helper thu cong la du.

### Acceptance

- Payload loi tra `400` voi message ro.
- Khong co record DB voi `NaN`.
- Note qua dai bi cat hoac reject ro rang.

## 5. Chuan hoa error response cho viewer

### File can xu ly

- `ohif-viewer/extensions/minipacs/src/services/viewerApiClient.ts`
- Cac route trong `dashboard/app/api/viewer/**`

### Van de

`viewerApiClient` hien doc `errorData.message`, nhung mot so API tra `{ error: '...' }`. Ket qua la toast co the hien `HTTP Error` chung chung.

### Cach sua

Trong client:

```ts
const message = errorData?.message || errorData?.error;
if (message) errorMessage = message;
```

Trong backend nen thong nhat:

```ts
return NextResponse.json(
  { success: false, message: 'Database error' },
  { status: 500 }
);
```

### Acceptance

- API tra `{ error }` viewer van hien noi dung loi.
- API tra `{ message }` viewer van hien noi dung loi.
- Loi auth/report khong hien chung chung `HTTP Error`.

## 6. Update script va Prisma migration

### File can xu ly

- `update.sh`
- `docker-compose.yml` neu command dashboard can can chinh

### Muc tieu

Phase 8 da co Prisma migration. Phase 9 can tranh tinh trang moi lan update chi `db push` ma bo qua migration history.

### Cach lam khuyen nghi

Trong `update.sh`, uu tien:

```sh
if [ -d dashboard/prisma/migrations ] && [ "$(find dashboard/prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l)" -gt 0 ]; then
  compose run --rm --no-deps dashboard ./node_modules/.bin/prisma migrate deploy
else
  compose run --rm --no-deps dashboard ./node_modules/.bin/prisma db push --skip-generate
fi
```

Neu van giu `db push` trong `docker-compose.yml` khi container start, can can nhac:

- Dev/local: chap nhan duoc.
- Production: nen dung `migrate deploy` trong update script, container start chi `npm start`.

### Acceptance

- `sudo bash ./update.sh` apply schema moi ma khong lam mat du lieu.
- Migration duoc track ro rang.
- Build/restart khong phu thuoc vao viec Postgres public port.

## 7. Test bat buoc sau khi lam

### Build

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

### Manual API test

- Chua login:
  - `GET /api/viewer/studies/[uid]/context` phai `401`.
  - `GET /api/viewer/studies/[uid]/history` phai `401`.
  - `GET /api/viewer/snapshots?studyInstanceUid=...` phai `401`.
  - `POST /api/viewer/snapshots` phai `401`.
- Login thieu quyen:
  - Cac API tren phai `403`.
- Login co quyen:
  - Cac API tren hoat dong nhu Phase 8.

### Manual viewer test

- Mo viewer custom bang ca CT that.
- Bam Save Snapshot, reload Gallery van thay record.
- Bam Key Image, API list key-images tra record moi.
- Bam History, hien cac ca cung patient neu co.
- Bam Report:
  - Chua login: hien toast can dang nhap, khong redirect im lang.
  - Co quyen: mo report link.
  - Thieu quyen: hien toast khong co quyen.
- Bam Download, modal OHIF mo duoc va co audit `download_opened`.

## Acceptance Criteria tong

Phase 9 chi coi la xong khi:

- Khong con API viewer doc/ghi du lieu benh nhan ma khong check permission.
- `docker-compose.yml` khong expose Postgres mac dinh.
- Audit log co action semantic sau khi thao tac thanh cong.
- Error toast doc duoc ca `message` va `error`.
- Payload ghi DB duoc validate co ban.
- `update.sh` xu ly schema theo migration an toan hon.
- Build pass dashboard, extension va mode.
- Chay `sudo bash ./update.sh` khong lam mat du lieu cu.

## Prompt cho AI code Phase 9

Hay implement Phase 9 theo file `docs/MINIPACS_VIEWER_PHASE9_SECURITY_AUDIT_HARDENING_PLAN.md`.

Pham vi:

- Chi sua bao mat API viewer, audit semantic, error handling, docker-compose DB exposure, update schema flow va validation payload.
- Khong them UI lon.
- Khong doi layout viewer.
- Khong xoa du lieu, khong doi volume Docker.
- Giu behavior Phase 8 neu user co quyen hop le.

Sau khi lam xong, chay build:

```bash
cd dashboard && npm run build
cd ohif-viewer && npm run build --workspace=@ohif/extension-minipacs
cd ohif-viewer && npm run build --workspace=@ohif/mode-minipacs-viewer
```

Bao cao lai:

- Cac file da sua.
- API nao da them auth/permission.
- Audit action nao da them.
- `docker-compose.yml` da bo expose Postgres hay chua.
- Ket qua build.
