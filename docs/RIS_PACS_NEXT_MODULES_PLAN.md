# Ke hoach phat trien RIS/PACS: trang thai ca chup va cac phan he tiep theo

Ngay tao: 2026-06-20

## Muc tieu

Bo sung lop nghiep vu RIS/PACS that su cho Mini PACS, bat dau tu trang thai ca chup, sau do phat trien cac phan he quan tri PACS, quan tri chuyen mon RIS, tiep don/tra ket qua va dashboard thong ke.

Trong code hien tai:

- Orthanc dang la PACS core, chay qua Docker va doc cau hinh tu `config/orthanc.json`.
- Dashboard Next.js dang doc danh sach study tu Orthanc bang `dashboard/app/actions.ts`.
- Prisma hien co `Report`, `User`, `PrintTemplate`, `WorklistOrder`.
- `ReportStatus` dang mo ta trang thai phieu doc, khong nen dung thay cho trang thai ca chup.
- `WorklistOrder.status` hien la `String`, can doi thanh enum de tranh sai lech du lieu.

Huong phat trien dung chuyen mon:

- RIS luu workflow, order, trang thai, bac si, mau bao cao, phong kham va audit log.
- PACS/Orthanc luu anh DICOM va metadata anh.
- Viewer/OHIF dung de doc anh, khong gan logic quan tri he thong vao viewer.
- Moi thao tac voi Orthanc API phai di qua server-side action/API cua dashboard, khong de lo Orthanc credential ra browser.

## Nguyen tac thiet ke nghiep vu

- Tach 3 lop trang thai: `OrderStatus`, `StudyStatus`, `ReportStatus`.
- Moi thay doi trang thai quan trong phai co audit trail: ai doi, luc nao, tu trang thai nao sang trang thai nao, ly do neu co.
- Trang thai ca chup phai co the tu dong cap nhat tu Orthanc khi co anh moi, nhung van cho phep ky thuat vien/admin sua co kiem soat.
- Hanh dong nguy hiem nhu xoa anh cu, doi DICOM port, doi Local AE Title phai can quyen admin va xac nhan nhieu buoc.
- Khong xoa metadata RIS khi xoa anh cu; ca chup da xoa anh van can thay trong lich su voi trang thai `ARCHIVED` hoac `DELETED_FROM_PACS`.
- Tat ca man hinh admin can toi uu cho phong kham: ro rang, it chu trang tri, nhan manh canh bao va trang thai.

## Phan he 0: Trang thai ca chup

Day la phan can lam dau tien vi cac man hinh sau deu phu thuoc vao vong doi ca chup.

### Trang thai de xuat

`OrderStatus` dung cho lenh chi dinh/truoc khi chup:

| Gia tri | Hien thi | Y nghia |
| --- | --- | --- |
| `REQUESTED` | Moi tao | Le tan/bac si vua tao chi dinh |
| `SCHEDULED` | Da hen lich | Da co ngay gio, modality, phong chup |
| `ARRIVED` | Benh nhan da den | Benh nhan da check-in tai phong kham |
| `CANCELLED` | Da huy | Huy chi dinh truoc khi chup |
| `EXPIRED` | Qua han | Worklist qua ngay nhung chua chup |

`StudyStatus` dung cho ca chup/hinh anh:

| Gia tri | Hien thi | Y nghia |
| --- | --- | --- |
| `ORDERED` | Cho chup | Da co order, chua co anh trong PACS |
| `READY_FOR_SCAN` | San sang chup | Da phat MWL cho may chup |
| `IN_PROGRESS` | Dang chup | May chup dang gui anh hoac ca dang thuc hien |
| `RECEIVED` | Da nhan anh | Orthanc da nhan instance dau tien |
| `STABLE` | Anh da on dinh | Orthanc bao study stable, tam coi nhu gui xong |
| `NEEDS_QC` | Can kiem tra | Can ky thuat vien kiem tra chat luong anh |
| `QC_REJECTED` | Can chup lai | Anh loi, thieu tu the, sai PID, sai protocol |
| `READY_TO_READ` | Cho doc | Anh dat QC va san sang cho bac si |
| `READING` | Dang doc | Bac si dang mo/soan bao cao |
| `REPORTED` | Da co bao cao | Da co bao cao nhap xong nhung chua ky cuoi |
| `FINALIZED` | Da ky | Bao cao da ky/phat hanh chinh thuc |
| `DELIVERED` | Da tra ket qua | Da in/gui/tra ket qua cho benh nhan |
| `ARCHIVED` | Da luu tru | Da qua giai doan khai thac thuong xuyen |
| `DELETED_FROM_PACS` | Da xoa anh | Anh da xoa khoi Orthanc, giu metadata RIS |
| `ERROR` | Loi | Loi dong bo, loi DICOM, loi workflow |

`ReportStatus` dung rieng cho phieu doc:

| Gia tri moi | Mapping hien tai | Y nghia |
| --- | --- | --- |
| `UNREAD` | `UNREAD` | Chua co noi dung doc |
| `DRAFT` | `DRAFT`, `DRAFTING` | Dang soan/lUU nhap |
| `PRELIMINARY` | Chua co | Doc so bo, chua ky chinh thuc |
| `FINAL` | `FINAL`, `COMPLETED` | Da ky/phat hanh |
| `AMENDED` | Chua co | Da sua sau khi phat hanh |
| `CANCELLED` | Chua co | Huy/phieu khong con hieu luc |

Luu y migration: neu chua muon sua `ReportStatus` ngay, co the giu enum hien tai va them `StudyStatus` truoc. Tuy nhien can chuan hoa dan de tranh `COMPLETED` vua co nghia hoan tat bao cao vua bi hieu thanh hoan tat ca chup.

### Luong chuyen trang thai chuan

1. Le tan tao order: `OrderStatus.REQUESTED`, `StudyStatus.ORDERED`.
2. Order duoc len lich va tao worklist file: `OrderStatus.SCHEDULED`, `StudyStatus.READY_FOR_SCAN`.
3. Benh nhan den: `OrderStatus.ARRIVED`.
4. Orthanc nhan DICOM instance dau tien theo `StudyInstanceUID` hoac `AccessionNumber`: `StudyStatus.RECEIVED`.
5. Orthanc bao stable: `StudyStatus.STABLE`.
6. Ky thuat vien QC dat: `StudyStatus.READY_TO_READ`.
7. Ky thuat vien QC fail: `StudyStatus.QC_REJECTED`, bat buoc co ly do.
8. Bac si mo ca de doc: `StudyStatus.READING`, `ReportStatus.DRAFT`.
9. Bac si luu nhap: `ReportStatus.DRAFT`, `StudyStatus.READING`.
10. Bac si ky: `ReportStatus.FINAL`, `StudyStatus.FINALIZED`.
11. Le tan in/gui ket qua: `StudyStatus.DELIVERED`.
12. Luu tru/xoa anh cu: `StudyStatus.ARCHIVED` hoac `StudyStatus.DELETED_FROM_PACS`.

### Data model de xuat

Them enum:

```prisma
enum OrderStatus {
  REQUESTED
  SCHEDULED
  ARRIVED
  CANCELLED
  EXPIRED
}

enum StudyStatus {
  ORDERED
  READY_FOR_SCAN
  IN_PROGRESS
  RECEIVED
  STABLE
  NEEDS_QC
  QC_REJECTED
  READY_TO_READ
  READING
  REPORTED
  FINALIZED
  DELIVERED
  ARCHIVED
  DELETED_FROM_PACS
  ERROR
}
```

Them model `ImagingStudy`:

```prisma
model ImagingStudy {
  id                 String      @id @default(uuid())
  studyInstanceUid   String      @unique
  orthancStudyId      String?     @unique
  accessionNumber     String?
  patientId           String?
  patientName         String?
  modality            String?
  bodyPart            String?
  studyDescription    String?
  status              StudyStatus @default(ORDERED)
  orderId             String?
  order               WorklistOrder? @relation(fields: [orderId], references: [id])
  report              Report?
  scheduledAt         DateTime?
  receivedAt          DateTime?
  stableAt            DateTime?
  finalizedAt         DateTime?
  deliveredAt         DateTime?
  archivedAt          DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  @@index([status])
  @@index([patientId])
  @@index([accessionNumber])
  @@index([modality])
  @@map("imaging_studies")
}
```

Them model `StudyStatusHistory`:

```prisma
model StudyStatusHistory {
  id              String       @id @default(uuid())
  imagingStudyId  String
  fromStatus      StudyStatus?
  toStatus        StudyStatus
  reason          String?
  actorUserId     String?
  source          String       @default("SYSTEM")
  metadataJson    String?      @db.Text
  createdAt       DateTime     @default(now())

  @@index([imagingStudyId])
  @@index([createdAt])
  @@map("study_status_history")
}
```

Cap nhat `WorklistOrder`:

- Doi `status String` thanh `status OrderStatus @default(REQUESTED)`.
- Them `scheduledStationAeTitle`, `bodyPart`, `procedureCode`, `priority`, `notes`.
- Them lien ket 1-n voi `ImagingStudy`.

Cap nhat `Report`:

- Them `imagingStudyId String? @unique`.
- Giu `studyInstanceUid` trong giai doan chuyen tiep de khong lam hong man hinh hien co.
- Khi report final, cap nhat ca `ReportStatus` va `StudyStatus`.

### Service can co

Tao service server-side:

- `orthancClient`: goi Orthanc API, gan auth, xu ly loi chung.
- `studySyncService`: dong bo study tu Orthanc vao `ImagingStudy`.
- `studyStatusService`: doi trang thai co validate transition va ghi history.
- `reportWorkflowService`: khi report draft/final thi cap nhat ca report va study.

Logic dong bo:

- Khi `getStudies()` lay danh sach Orthanc, neu study chua co trong RIS thi tao `ImagingStudy` voi `status = STABLE` neu Orthanc da stable, hoac `RECEIVED` neu moi nhan.
- Match uu tien theo `StudyInstanceUID`.
- Neu co `AccessionNumber`, match nguoc ve `WorklistOrder`.
- Khong de frontend tu y set status truc tiep; frontend goi action co rule.

### UI can sua tren man hinh danh sach ca chup

Them cot:

- Trang thai ca chup.
- Trang thai bao cao.
- Bac si doc.
- Thoi gian cho doc/SLA.

Them filter:

- Tat ca.
- Cho chup.
- Da nhan anh.
- Cho doc.
- Dang doc.
- Da ky.
- Da tra.
- Loi/can xu ly.

Mau badge de xuat:

- `ORDERED`, `READY_FOR_SCAN`: xam xanh.
- `RECEIVED`, `STABLE`: cyan/teal.
- `READY_TO_READ`: xanh la nhe.
- `READING`, `DRAFT`: vang/cam muted.
- `FINALIZED`, `DELIVERED`: xanh la dam.
- `QC_REJECTED`, `ERROR`: do muted.
- `DELETED_FROM_PACS`: xam dam, co icon canh bao.

Hanh dong theo role:

- Le tan: tao order, check-in, in/giao ket qua.
- Ky thuat vien: QC dat/fail, mark chup lai, xem list.
- Bac si: nhan doc, luu nhap, ky final.
- Admin: sua trang thai bat thuong, xoa/luu tru, audit.

## Phan he 1: Quan tri he thong PACS va IT

Muc tieu: IT phong kham co the cau hinh va giam sat Orthanc/PACS ma khong can sua file tay.

### 1.1 Man hinh Quan ly DICOM Nodes

Route de xuat: `/admin/pacs/nodes`

Muc dich:

- Khai bao cac may chup duoc phep ket noi voi PACS.
- Test C-Echo tu Orthanc server toi may chup.
- Quan ly danh sach modality theo phong, loai may, AE Title.

Fields:

| Field | Kieu | Bat buoc | Ghi chu |
| --- | --- | --- | --- |
| `name` | String | Co | Vi du: `X-Quang Phong 1` |
| `aeTitle` | String | Co | 1-16 ky tu, nen uppercase, vi du `CR_ROOM1` |
| `ipAddress` | String | Co | IPv4/domain noi bo |
| `port` | Int | Co | Thuong 104, 11112, 4242 tuy may |
| `modality` | String | Co | CR, DX, US, CT, MR |
| `room` | String | Khong | Phong chup |
| `isActive` | Boolean | Co | Tat node khong dung |
| `lastEchoStatus` | Enum/String | Khong | OK/FAILED/UNKNOWN |
| `lastEchoAt` | DateTime | Khong | Lan ping gan nhat |

Model de xuat:

```prisma
model DicomNode {
  id             String   @id @default(uuid())
  name           String
  aeTitle        String
  ipAddress      String
  port           Int
  modality       String
  room           String?
  isActive       Boolean  @default(true)
  orthancAlias   String   @unique
  lastEchoStatus String?
  lastEchoMessage String?
  lastEchoAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([aeTitle])
  @@map("dicom_nodes")
}
```

Orthanc API can dung:

- List node tu Orthanc: `GET /modalities`
- Lay cau hinh node: `GET /modalities/{id}`
- Tao/sua node: `PUT /modalities/{id}`
- Xoa node: `DELETE /modalities/{id}`
- Ping DICOM C-Echo: `POST /modalities/{id}/echo`

Luu y:

- `orthancAlias` nen la slug noi bo, vi du `cr_room1`, khong dung ten co dau.
- Dashboard nen luu `DicomNode` trong DB de co ten phong, loai may, audit va UI metadata.
- Khi luu node, sync sang Orthanc. Neu sync Orthanc fail thi rollback DB hoac danh dau `syncStatus = ERROR`.
- Sau khi tao node, nen chay C-Echo ngay va hien ket qua.
- Chi role `ADMIN` duoc tao/sua/xoa node. Role `TECHNICIAN` co the bam Ping neu duoc cap quyen.

Validation:

- AE Title toi da 16 ky tu.
- Khong cho trung AE Title dang active.
- Port trong khoang 1-65535.
- IP/domain phai hop le.
- Can canh bao khi dung port 104 vi co the can quyen root tren thiet bi.

### 1.2 Man hinh Cau hinh PACS Server

Route de xuat: `/admin/pacs/server`

Muc dich:

- Xem va cau hinh Local AE Title cua Orthanc.
- Xem DICOM receive port.
- Hien thi thong tin Orthanc server va trang thai dich vu.

Fields:

| Field | Gia tri hien tai | Ghi chu |
| --- | --- | --- |
| `DicomAet` | `ORTHANC` | Local AE Title Orthanc |
| `DicomPort` | `4242` | Port nhan DICOM |
| `HttpPort` | `8042` | Port API Orthanc noi bo |
| `Name` | `Mini PACS Orthanc` | Ten instance |

Orthanc API de doc:

- `GET /system`: doc ten he thong, version, API status.

Can luu y ky thuat:

- `DicomAet` va `DicomPort` thuong la cau hinh khoi dong, khong nen hieu la doi xong co hieu luc ngay.
- Hien tai `config/orthanc.json` dang mount read-only vao Orthanc container.
- Dashboard container hien chua mount `./config`, nen khong the sua truc tiep file config neu chua doi Docker compose.

Huong trien khai an toan:

1. Man hinh doc cau hinh hien tai tu DB va `/system`.
2. Khi admin sua AE/port, luu vao bang `PacsServerConfig` voi `pendingRestart = true`.
3. Neu muon tu dong ghi file, can them volume cho dashboard: `./config:/app/config` voi quyen write.
4. Sau khi ghi `orthanc.json`, hien canh bao: "Can restart Orthanc de ap dung".
5. Khong restart container tu UI o ban dau neu chua co co che quan tri Docker an toan.

Model de xuat:

```prisma
model PacsServerConfig {
  id             String   @id @default(uuid())
  name           String
  dicomAet       String
  dicomPort      Int
  httpPort       Int
  pendingRestart Boolean  @default(false)
  updatedById    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("pacs_server_configs")
}
```

UI can co:

- Card thong tin Orthanc: version, DICOM AET, DICOM port, HTTP API.
- Form sua Local AE Title va DICOM port.
- Badge `Dang ap dung` hoac `Cho restart`.
- Canh bao ro rang khi doi port: may chup phai cau hinh lai noi gui anh.

### 1.3 Man hinh Quan ly Dung luong

Route de xuat: `/admin/pacs/storage`

Muc dich:

- Theo doi dung luong anh DICOM de tranh day o cung lam sap Docker/PACS.
- Xoa/luu tru ca chup cu co kiem soat.

Nguon du lieu:

- Orthanc statistics: `GET /statistics`
- OS/disk free: can doc filesystem volume chua `pacs_data/orthanc`
- DB RIS: thong ke so ca theo thang, modality, trang thai

Can sua Docker neu muon hien thi dung luong that:

- Mount `./pacs_data/orthanc:/mnt/orthanc-storage:ro` vao dashboard.
- Dung Node `fs.statfs` de tinh free/used/total.
- Neu chua mount duoc, hien thong ke Orthanc storage va canh bao "chua co thong tin free disk".

Chi so can hien:

- Tong dung luong o dia.
- Da dung.
- Con trong.
- % da dung.
- Tong so patients/studies/series/instances.
- Dung luong DICOM theo Orthanc.
- Trend 7 ngay/30 ngay neu co du lieu.

Canh bao:

- > 75%: canh bao vang.
- > 85%: canh bao cam, khuyen nghi don dep.
- > 92%: canh bao do, co nguy co ngung nhan anh.
- > 95%: khoa thao tac upload/order neu can, chi cho admin xu ly.

Nut xoa ca chup cu hon 6 thang:

- Khong xoa ngay khi bam lan dau.
- Buoc 1: bam `Quet ca cu hon 6 thang`.
- Buoc 2: hien danh sach se xoa: ngay chup, ten BN, PID, modality, so instance, dung luong uoc tinh, trang thai.
- Buoc 3: chi cho xoa neu study da `DELIVERED`, `ARCHIVED` hoac co chinh sach cho phep.
- Buoc 4: bat admin go chinh xac cau: `TOI HIEU SE XOA ANH DICOM`.
- Buoc 5: xoa tung batch nho, ghi audit log tung study.

Orthanc API:

- Tim study cu: co the dung `GET /studies?expand` roi filter theo `MainDicomTags.StudyDate`, hoac `POST /tools/find`.
- Xoa study: `DELETE /studies/{orthancStudyId}`.

Chinh sach giu metadata:

- Sau khi xoa Orthanc study, cap nhat `ImagingStudy.status = DELETED_FROM_PACS`.
- Giu `studyInstanceUid`, accession, patient metadata, report PDF/html, status history.
- Neu da xoa anh, UI khong mo OHIF nua ma hien "Anh da duoc xoa khoi PACS ngay ...".

## Phan he 2: Quan tri chuyen mon y te - RIS Settings

Muc tich: Truong phong kham/bac si truong khoa quan ly nguoi dung, mau bao cao va thong tin phong kham.

### 2.1 Quan ly Nguoi dung va Phan quyen

Route de xuat: `/admin/users`

Roles can co:

| Role | Quyen chinh |
| --- | --- |
| `ADMIN` | Toan quyen, cau hinh PACS, user, storage |
| `DOCTOR` | Doc phim, luu nhap, ky final, sua report theo policy |
| `TECHNICIAN` | Xem list, tao/cap nhat QC, thao tac chup, khong ky report |
| `RECEPTION` | Tao order, check-in, in/gui ket qua, khong xem cau hinh PACS |

Can cap nhat enum `Role`:

```prisma
enum Role {
  ADMIN
  DOCTOR
  TECHNICIAN
  RECEPTION
}
```

Fields user:

- Username.
- Full name.
- Password/reset password.
- Role.
- Is active.
- Phone/email neu can.
- Doctor title: `BS`, `ThS.BS`, `CKI`, `CKII`.
- Department/specialty.
- Signature image.
- License/practicing certificate number neu phong kham can in.

Model bo sung:

```prisma
model DoctorProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  title           String?
  specialty       String?
  licenseNumber   String?
  signatureImagePath String?
  isSigningDoctor Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("doctor_profiles")
}
```

Chuc nang:

- Tao/sua/khoa user.
- Reset password.
- Upload chu ky scan.
- Preview chu ky tren mau PDF.
- Gan role.
- Audit khi doi role hoac khoa user.

Bao mat:

- Khong hien password cu.
- Chi admin duoc tao admin moi.
- Khi user bi khoa, token/session cu nen het hieu luc o lan kiem tra tiep theo.

### 2.2 Quan ly Mau Bao Cao / Canned Texts

Route de xuat: `/settings/report-templates`

Muc dich:

- Bac si khong phai go lai cac mau binh thuong.
- Template co the goi bang nut chon hoac shortcut, vi du `/phoi`.

Fields:

| Field | Ghi chu |
| --- | --- |
| `name` | Ten mau, vi du `Phoi binh thuong` |
| `modality` | DX, CR, CT, US, MR |
| `bodyPart` | CHEST, ABDOMEN, SKULL, SPINE... |
| `shortcut` | `/phoi`, `/xoang`, `/cot-song-co` |
| `findings` | Noi dung mo ta |
| `conclusion` | Ket luan |
| `recommendation` | De nghi neu co |
| `isNormal` | Danh dau mau binh thuong |
| `isActive` | An/hien |
| `ownerUserId` | Neu la mau rieng cua bac si |
| `scope` | GLOBAL/PRIVATE/DEPARTMENT |

Model de xuat:

```prisma
model ReportTemplateText {
  id             String   @id @default(uuid())
  name           String
  modality       String
  bodyPart       String?
  shortcut       String?
  findings       String   @db.Text
  conclusion     String   @db.Text
  recommendation String?  @db.Text
  isNormal       Boolean  @default(false)
  isActive       Boolean  @default(true)
  scope          String   @default("GLOBAL")
  ownerUserId    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([modality])
  @@index([bodyPart])
  @@index([shortcut])
  @@map("report_template_texts")
}
```

Vi du template:

- Modality: `DX`
- Body part: `CHEST`
- Shortcut: `/phoi`
- Findings: `Bong tim khong to. Hai phe truong sang. Khong thay ton thuong nhu mo/ke khu tru. Khong tran dich, tran khi mang phoi.`
- Conclusion: `Tim phoi trong gioi han binh thuong.`

Tich hop vao man hinh doc phim:

- Them nut template gan editor.
- Khi chon modality/body part, goi API lay template phu hop.
- Trong editor, go `/phoi` thi bung text.
- Cho preview truoc khi chen de tranh ghi de noi dung dang soan.
- Khi chen template, mac dinh append hoac replace theo lua chon ro rang.

### 2.3 Cau hinh Thong tin Phong Kham

Route de xuat: `/settings/clinic-profile`

Muc dich:

- Quan ly logo, ten phong kham, dia chi, so dien thoai de in PDF/header/footer.

Fields:

- Clinic name.
- Legal name neu khac ten hien thi.
- Address.
- Phone.
- Email.
- Website.
- Logo image.
- Header text.
- Footer text.
- License number.
- Default report language.

Model de xuat:

```prisma
model ClinicProfile {
  id           String   @id @default(uuid())
  name         String
  legalName    String?
  address      String?
  phone        String?
  email        String?
  website      String?
  logoPath     String?
  headerText   String?  @db.Text
  footerText   String?  @db.Text
  licenseNumber String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("clinic_profiles")
}
```

Tich hop PDF/report:

- `PrintTemplateViewer` can lay `ClinicProfile`.
- Header PDF tu dong co logo, ten phong kham, dia chi, hotline.
- Footer co chu ky bac si, thoi gian ky, trang so.
- Neu chua cau hinh logo, fallback ve header text don gian.

## Phan he 3: Workflow tiep don va tra ket qua

Muc tieu: Neu phong kham khong co HIS rieng, dashboard se dong vai tro RIS nhe.

### 3.1 Man hinh Le tan / Order Entry / Modality Worklist

Route de xuat:

- `/worklist`
- `/worklist/new`
- `/worklist/{id}`

Muc dich:

- Nhap thong tin benh nhan truoc khi chup.
- Tao DICOM Modality Worklist de may chup lay lenh, tranh go tay PID.
- Theo doi ca tu luc tao order den khi tra ket qua.

Fields can bo sung vao form hien tai:

- Patient name.
- Patient ID.
- DOB/age.
- Gender.
- Phone.
- Referring physician.
- Modality.
- Body part.
- Procedure description.
- Priority: routine/urgent.
- Scheduled date/time.
- Scheduled station AE Title.
- Notes.

Can sua logic tao worklist:

- Hien tai `ScheduledStationAETitle` dang hardcode `AETITLE`; can lay tu `DicomNode.aeTitle`.
- Ten procedure nen lay tu form, khong hardcode `Routine procedure`.
- `StudyInstanceUID` nen sinh dung format on dinh hoac de may chup sinh, tuy policy.
- Worklist file can duoc cap nhat/xoa khi order cancel.

Trang thai:

- Tao order: `REQUESTED`.
- Len lich may chup: `SCHEDULED` va `READY_FOR_SCAN`.
- Benh nhan den: `ARRIVED`.
- May chup gui anh: dong bo sang `RECEIVED/STABLE`.

UI:

- Danh sach order hom nay theo phong chup.
- Badge trang thai.
- Nut check-in.
- Nut huy order.
- Nut tao lai worklist file.
- Nut mo ca chup neu anh da ve.

### 3.2 Man hinh Lich su va In an / Archive

Route de xuat: `/archive`

Muc dich:

- Tim ca da final/delivered de in lai, gui lai, hoac xem lich su.

Search fields:

- Patient name.
- Patient ID.
- Accession number.
- Study date range.
- Modality.
- Doctor.
- Status.

Chuc nang:

- Mo report da final.
- In lai phieu.
- Xuat PDF.
- Mo OHIF neu anh con trong PACS.
- Hien canh bao neu anh da bi xoa khoi PACS.
- Ghi log moi lan in/gui lai.

Lien quan gui Zalo:

- Khong nen dua vao giai doan dau neu chua co API/consent ro rang.
- Co the lam buoc trung gian: xuat PDF va hien QR/link noi bo co het han.
- Can log ai gui, gui luc nao, gui cho ai.

## Phan he 4: Dashboard thong ke

Route de xuat: `/dashboard` hoac `/statistics`

Muc dich:

- Giam sat khoi luong cong viec va backlog doc phim.
- Ho tro tinh luong/hoa hong bac si theo so ca final.
- Canh bao ca chua doc.

Chi so can co:

1. Hom nay co bao nhieu ca chup.
2. So ca theo modality: DX/CR, US, CT, MR.
3. Bao nhieu ca dang `READY_TO_READ`.
4. Bao nhieu ca dang `READING/DRAFT`.
5. Bao nhieu ca da `FINALIZED`.
6. Bao nhieu ca da `DELIVERED`.
7. Bac si A da final bao nhieu ca trong ngay/thang.
8. Thoi gian trung binh tu `RECEIVED` den `FINALIZED`.
9. So ca QC fail/can chup lai.
10. Dung luong PACS va toc do tang dung luong.

Data source:

- `ImagingStudy` cho trang thai ca chup.
- `Report` cho bac si va trang thai report.
- `StudyStatusHistory` cho thoi gian xu ly/SLA.
- Orthanc statistics cho tong instances/storage.

Widget UI:

- Cards KPI tren cung.
- Bar chart ca theo modality.
- Table bac si va so ca final.
- Queue "Cho doc" sap xep theo do uu tien/thoi gian cho.
- Storage warning card.

Quyen truy cap:

- Admin: xem tat ca.
- Doctor: xem queue va thong ke cua minh.
- Reception/Technician: xem thong ke van hanh co ban, khong xem hoa hong neu nhay cam.

## Kien truc API va server actions

Thu muc de xuat:

```text
dashboard/app/admin/pacs/nodes/page.tsx
dashboard/app/admin/pacs/nodes/actions.ts
dashboard/app/admin/pacs/server/page.tsx
dashboard/app/admin/pacs/server/actions.ts
dashboard/app/admin/pacs/storage/page.tsx
dashboard/app/admin/pacs/storage/actions.ts
dashboard/app/admin/users/page.tsx
dashboard/app/admin/users/actions.ts
dashboard/app/settings/report-templates/page.tsx
dashboard/app/settings/report-templates/actions.ts
dashboard/app/settings/clinic-profile/page.tsx
dashboard/app/settings/clinic-profile/actions.ts
dashboard/app/archive/page.tsx
dashboard/app/archive/actions.ts
dashboard/app/statistics/page.tsx
dashboard/app/statistics/actions.ts
dashboard/lib/orthancClient.ts
dashboard/lib/studyStatusService.ts
dashboard/lib/auditLog.ts
```

Quy tac:

- Moi route admin check session va role server-side.
- Orthanc credential chi nam trong env server.
- Moi action nguy hiem can ghi `AuditLog`.
- Form dung Zod validation.
- Cac enum status khong dung string tu do.

Model `AuditLog` de xuat:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  actorUserId String?
  action      String
  entityType  String
  entityId    String?
  message     String?
  metadataJson String? @db.Text
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([actorUserId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## Thu tu trien khai khuyen nghi

### Giai doan 1: Nen tang trang thai ca chup

1. Them enum `OrderStatus`, `StudyStatus`.
2. Them `ImagingStudy`, `StudyStatusHistory`, `AuditLog`.
3. Migration `WorklistOrder.status` tu string sang enum.
4. Tao `studyStatusService`.
5. Sua `getStudies()` de sync Orthanc studies vao `ImagingStudy`.
6. Hien badge trang thai ca chup tren dashboard hien tai.
7. Khi bac si luu nhap/final report, cap nhat `StudyStatus`.

Tieu chi xong:

- Danh sach ca chup co status rieng.
- Status khong con phu thuoc duy nhat vao report.
- Co history khi doi status.

### Giai doan 2: Quan ly user va role

1. Them role `TECHNICIAN`.
2. Them `DoctorProfile`.
3. Lam man hinh user management.
4. Them upload chu ky scan.
5. Gan chu ky vao print template.

Tieu chi xong:

- Admin quan ly user duoc.
- Bac si co chu ky hien trong phieu in.
- Quyen le tan/ky thuat vien/bac si/admin tach ro.

### Giai doan 3: Template va clinic profile

1. Them `ReportTemplateText`.
2. Lam man hinh tao/sua template.
3. Tich hop chon template vao man hinh doc phim.
4. Them clinic profile.
5. Gan clinic profile vao PDF/print viewer.

Tieu chi xong:

- Bac si co the chen mau binh thuong theo modality/body part.
- Shortcut `/phoi` hoat dong neu editor ho tro.
- PDF co header/footer phong kham.

### Giai doan 4: PACS admin

1. Tao `orthancClient`.
2. Lam DICOM Nodes CRUD.
3. Them C-Echo/Ping.
4. Lam PACS server config read-only truoc.
5. Sau do moi them save config co `pendingRestart`.
6. Lam storage dashboard.
7. Lam quy trinh xoa ca cu hon 6 thang co dry-run.

Tieu chi xong:

- IT ping may chup duoc tu UI.
- Xem duoc Orthanc/server/storage.
- Xoa ca cu co canh bao va audit.

### Giai doan 5: Workflow le tan va archive

1. Nang cap form order entry.
2. Lay Scheduled Station AE tu `DicomNode`.
3. Dong bo order voi Orthanc study theo accession.
4. Tao archive search.
5. Them in lai/xuat PDF.

Tieu chi xong:

- Le tan tao order dung MWL.
- May chup thay ten benh nhan tren worklist.
- Ca final tim lai va in lai duoc.

### Giai doan 6: Dashboard thong ke

1. Tao aggregate queries theo ngay/thang.
2. Lam KPI cards.
3. Lam chart modality.
4. Lam bang so ca theo bac si.
5. Lam queue pending.
6. Them storage warning.

Tieu chi xong:

- Quan ly thay duoc so ca hom nay, pending, final, theo bac si.
- Pending queue dung theo `StudyStatus`, khong dem sai report draft.

## RUI RO va cach giam

### Rui ro 1: Doi config Orthanc lam mat ket noi may chup

Giam rui ro:

- Ban dau chi doc config, chua cho sua.
- Khi cho sua, bat backup config.
- Hien pending restart.
- Ghi audit.
- Co nut xem cau hinh truoc/sau.

### Rui ro 2: Xoa anh cu lam mat du lieu can tra lai

Giam rui ro:

- Chi xoa study da final/delivered/archived.
- Dry-run bat buoc.
- Xac nhan bang cau dai.
- Xoa theo batch.
- Ghi danh sach da xoa.
- Giu metadata/report.

### Rui ro 3: Status bi lech giua Orthanc va RIS

Giam rui ro:

- Co job sync tu Orthanc.
- Match theo `StudyInstanceUID` va `AccessionNumber`.
- Co man hinh loi dong bo.
- Moi transition qua service chung.

### Rui ro 4: Role chua chat

Giam rui ro:

- Check role server-side trong moi action.
- Khong chi an nut o frontend.
- Audit cac action quan trong.

### Rui ro 5: Worklist sai AE Title

Giam rui ro:

- Lay AE Title tu `DicomNode` da duoc Ping OK.
- Khong hardcode `AETITLE`.
- Hien field Scheduled Station AE tren order.

## Checklist nghiep vu khi hoan thanh

- Co vong doi ca chup rieng, khong tron voi report.
- Le tan tao order va theo doi trang thai.
- Ky thuat vien QC va danh dau chup lai neu can.
- Bac si doc, luu nhap, ky final.
- Le tan in/gui ket qua.
- Admin/IT quan ly DICOM nodes, ping may chup, xem dung luong.
- Truong khoa quan ly mau bao cao va thong tin phong kham.
- Dashboard tinh dung so ca theo modality, bac si, pending.
- Hanh dong nguy hiem co canh bao, xac nhan va audit.

## Ghi chu cho nguoi/code agent trien khai tiep

Nen bat dau bang `StudyStatus` va `ImagingStudy`. Day la xuong song cua toan bo workflow RIS/PACS. Neu lam ngay cac man hinh admin ma chua co status ca chup, dashboard va thong ke se phai sua lai nhieu lan.

Khi sua Prisma schema, can lap migration can than vi du lieu hien tai dang co `ReportStatus` va `WorklistOrder.status` dang la string. Nen viet script backfill:

- Worklist `PENDING` -> `REQUESTED`.
- Report `UNREAD` -> study `READY_TO_READ` neu anh da co trong Orthanc.
- Report `DRAFT/DRAFTING` -> study `READING`.
- Report `FINAL/COMPLETED` -> study `FINALIZED`.

Sau backfill, moi bat buoc enum/constraint chat hon.
