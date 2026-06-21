# Ke hoach tinh nang Thong ke cho Trung tam dieu hanh Chan doan hinh anh

Ngay tao: 2026-06-21

## Muc tieu

Nang cap module `Statistics` hien tai tu dashboard thong ke co ban thanh man hinh dieu hanh RIS/PACS dung cho trung tam chan doan hinh anh. Man hinh moi khong chi dem so ca, ma phai giup dieu phoi nhin thay ngay:

- Ca nao dang ket trong workflow.
- May/phong nao dang qua tai hoac bi idle.
- Bac si nao dang co backlog.
- Ca nao sap/da vi pham SLA.
- PACS/DICOM co loi, day dung luong, mat ket noi hay khong.
- Chi so chat luong va an toan can canh bao.

Triet ly thiet ke: day la "Command Center", khong phai bao cao tinh. Moi KPI quan trong phai click drilldown duoc den danh sach ca cu the de xu ly.

## Tinh nang hien co

Module hien tai o `dashboard/app/statistics` dang co:

- Loc theo `dateFrom`, `dateTo`.
- KPI: ca trong ky, cho doc, dang doc/nhap, da ky, da tra, QC/loi.
- Ca theo modality.
- Trang thai hien tai cua cac ca chup.
- SLA trung binh tu nhan anh den ky.
- Thong ke theo bac si neu co quyen `statistics.doctorStats`.
- Queue cho doc toi da 20 ca.
- PACS storage tu Orthanc `/statistics`.

Day la nen tang tot, nhung van thieu lop dieu phoi realtime, SLA chi tiet, dieu hanh may chup, canh bao, audit va drilldown.

## Khoang cach so voi Command Center thuc te

### 1. Thieu realtime operations

Hien tai dashboard phu thuoc nut cap nhat thu cong. Trung tam dieu hanh can auto refresh va hien ngay nhung ca can can thiep.

Can bo sung:

- Auto refresh 15-30 giay.
- "Now board" cho ca trong ngay.
- Badge canh bao cho ca qua SLA.
- Danh sach ca bi ket workflow.

### 2. SLA/TAT con qua don gian

Hien tai moi tinh trung binh tu `RECEIVED` den `FINALIZED`. Can tach toan chuoi workflow:

- Order -> Check-in.
- Check-in -> Scan start.
- Scan start -> Scan end.
- Scan end -> PACS received.
- PACS received -> First read/open.
- First read/open -> Finalized.
- Finalized -> Delivered.

Can dung P50/P90/P95 ngoai average, vi average de bi meo boi outlier.

### 3. Thieu dieu hanh may chup/phong chup

Command Center can biet tung may dang lam gi:

- So ca theo `stationAeTitle`, phong, modality.
- Utilization theo gio.
- Thoi gian idle.
- No-show/cancel rate.
- So ca chua chup nhung da check-in.
- Du bao backlog cuoi ngay.

### 4. Thieu workload bac si doc phim

Can nhin thay:

- Bac si nao dang duoc assign bao nhieu ca.
- Backlog theo bac si, modality, priority.
- TAT theo bac si.
- So ca final trong ca truc/ngay/thang.
- Ca bi addendum/sua bao cao.
- De xuat assign ca dua tren tai hien tai.

### 5. Thieu PACS/DICOM health

Hien tai chi co Orthanc statistics. Can them:

- C-ECHO status tung DICOM node.
- Modality nao mat ket noi.
- Study nhan thieu instance/series.
- Latency tu modality gui anh den PACS stable.
- Duplicate accession/PID.
- Missing DICOM tags quan trong.
- Du bao day o cung.

### 6. Thieu quality & safety

Can them nhom chi so:

- QC reject rate.
- Ly do chup lai.
- Critical result tracking.
- Addendum/amendment rate.
- Dose monitoring neu lay duoc RDSR hoac dose tag.
- Peer review/discrepancy neu sau nay co quy trinh hoi chan.

## Nhom tinh nang de xuat

## A. Realtime Operations Board

### Muc tieu

Man hinh chinh cho dieu phoi vien/truong ca theo doi tinh hinh hom nay.

### Widget can co

- Tong ca hom nay.
- Da hen.
- Da check-in.
- Dang chup.
- Da nhan anh.
- Cho QC.
- Cho doc.
- Dang doc.
- Da ky.
- Da tra.
- Qua SLA.
- Co loi/can can thiep.

### Bang can co

1. `Stuck workflow`
   - Co order nhung chua co anh.
   - Co anh nhung chua QC.
   - Da QC nhung chua bac si doc.
   - Da ky nhung chua tra.

2. `SLA breach`
   - STAT qua nguong.
   - URGENT qua nguong.
   - ROUTINE qua nguong.

3. `Live queue`
   - Sap xep theo priority va waiting time.

### Dieu kien hoan thanh

- Auto refresh du lieu.
- KPI click duoc de loc danh sach ca.
- Moi ca qua SLA hien ro ly do va moc thoi gian.

## B. SLA/TAT Analytics

### Muc tieu

Do dung thoi gian xu ly tung chang cua workflow thay vi chi do thoi gian final.

### Chi so can co

- Average, median, P90, P95 cho tung chang.
- TAT theo modality.
- TAT theo priority.
- TAT theo bac si.
- TAT theo phong/may.
- TAT theo khung gio trong ngay.

### Du lieu can them

Can bo sung/bao dam cac moc thoi gian:

- `orderedAt`
- `checkedInAt`
- `scanStartedAt`
- `scanEndedAt`
- `receivedAt`
- `stableAt`
- `qcCompletedAt`
- `firstOpenedAt`
- `finalizedAt`
- `deliveredAt`

Neu chua co du moc, co the suy luan tam thoi:

- `receivedAt`: instance dau tien vao Orthanc.
- `stableAt`: Orthanc stable.
- `firstOpenedAt`: lan dau mo report/viewer.

### Dieu kien hoan thanh

- Co bang TAT theo chang.
- Co bieu do xu huong theo ngay.
- Co drilldown den cac ca lam TAT bi cham.

## C. Modality / Room Utilization

### Muc tieu

Quan ly nang luc van hanh cua may chup va phong chup.

### Chi so can co

- So ca theo may/phong.
- So ca theo gio.
- Utilization %.
- Idle time.
- Thoi gian scan trung binh.
- Cancel/no-show.
- Chup lai/QC reject theo may.

### Du lieu can them

- `DicomNode` da co/du kien co `aeTitle`, `modality`, `room`.
- `ImagingStudy.stationAeTitle`.
- `ImagingStudy.roomId` neu co nhieu phong.
- `ImagingStudy.scanStartedAt`.
- `ImagingStudy.scanEndedAt`.
- `WorklistOrder.cancelledAt`.
- `WorklistOrder.arrivedAt`.

### Dieu kien hoan thanh

- Biet may nao qua tai, may nao idle.
- Biet gio cao diem.
- Biet may/phong nao co QC reject cao bat thuong.

## D. Radiologist Workload Center

### Muc tieu

Ho tro truong khoa/dispatcher phan tai ca doc phim.

### Chi so can co

- Backlog theo bac si.
- Ca da final trong ngay/thang.
- Dang doc/nhap theo bac si.
- TAT theo bac si.
- So ca STAT/URGENT dang nam o moi bac si.
- Modality mix cua moi bac si.

### Chuc nang de xuat

- Assign ca cho bac si.
- Reassign ca.
- Loc queue theo bac si.
- Giai thich tai sao mot ca dang qua SLA.
- De xuat bac si phu hop dua theo tai va modality.

### Du lieu can them

- `assignedDoctorId` tren `ImagingStudy`.
- `firstOpenedAt`.
- `Report.doctorId`.
- `Report.finalizedAt` hoac mapping qua `updatedAt` hien co.

### Dieu kien hoan thanh

- Nhin duoc backlog tung bac si.
- Reassign ca khong mat history.
- Bac si chi thay phan viec cua minh neu role yeu cau.

## E. Alert & Escalation

### Muc tieu

Tu dong canh bao nhung ca can xu ly ngay.

### Alert rule can co

- STAT qua 30 phut chua final.
- URGENT qua 2 gio chua final.
- ROUTINE qua nguong cau hinh.
- Co order da check-in nhung qua X phut chua chup.
- Co study da stable nhung chua READY_TO_READ.
- Da final nhung qua X phut chua deliver.
- PACS storage vuot nguong.
- DICOM node echo fail.
- Study thieu accession/PID.

### UI can co

- Alert bell/count.
- Alert drawer.
- Muc do: info, warning, critical.
- Acknowledge alert.
- Assign owner.
- Ghi chu xu ly.

### Du lieu can them

Model de xuat:

```prisma
model OperationalAlert {
  id           String   @id @default(uuid())
  severity     String
  type         String
  title        String
  message      String
  entityType   String?
  entityId     String?
  status       String   @default("OPEN")
  assignedToId String?
  acknowledgedById String?
  acknowledgedAt DateTime?
  resolvedAt   DateTime?
  metadataJson String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status])
  @@index([severity])
  @@index([entityType, entityId])
}
```

### Dieu kien hoan thanh

- Alert duoc tao tu server-side rule.
- User acknowledge/resolution duoc.
- Alert click duoc den ca lien quan.

## F. PACS / DICOM Health Dashboard

### Muc tieu

Theo doi suc khoe he thong PACS, Orthanc va cac may chup.

### Widget can co

- Orthanc online/offline.
- DICOM receive status.
- Storage used/free.
- Growth rate GB/ngay.
- Du bao ngay day disk.
- C-ECHO tung modality.
- Last study received per modality.
- Failed sync/missing metadata.

### Nguon du lieu

- Orthanc `/system`.
- Orthanc `/statistics`.
- Orthanc `/modalities/{id}/echo`.
- DB `DicomNode`.
- DB `ImagingStudy`.
- File system free disk neu dashboard duoc mount storage path.

### Dieu kien hoan thanh

- IT nhin biet node nao fail.
- Storage co warning truoc khi day.
- Co lich su health check.

## G. Quality & Safety Dashboard

### Muc tieu

Theo doi chat luong hinh anh, bao cao va an toan nguoi benh.

### Chi so can co

- QC reject rate.
- Ly do reject.
- Repeat study rate.
- Missing critical data: PID, accession, DOB, sex.
- Addendum rate.
- Critical result pending communication.
- Dose outlier neu co du lieu dose.

### Du lieu can them

- `StudyQcEvent`.
- `ReportAddendum`.
- `CriticalResult`.
- Dose object/table neu lay duoc RDSR.

Model QC de xuat:

```prisma
model StudyQcEvent {
  id             String   @id @default(uuid())
  imagingStudyId String
  status         String
  reasonCode     String?
  note           String?
  actorUserId    String?
  createdAt      DateTime @default(now())

  @@index([imagingStudyId])
  @@index([reasonCode])
}
```

### Dieu kien hoan thanh

- QC fail bat buoc co ly do.
- Co chart ly do QC reject.
- Critical result co trang thai da thong bao/chua thong bao.

## H. Business / Referral Analytics

### Muc tieu

Ho tro quan ly trung tam ve san luong, nguon gui benh va mix dich vu.

### Chi so can co

- So ca theo nguon gui/bac si chi dinh.
- So ca theo khoa/phong kham/doi tac.
- Modality mix theo ngay/thang.
- Procedure mix.
- Huy/no-show theo nguon.
- Doanh thu uoc tinh neu co bang gia.

### Du lieu can them

- `referringPhysician`.
- `referringDepartment`.
- `facility/source`.
- `procedureCode`.
- `price`.
- `paymentStatus` neu sau nay can.

### Dieu kien hoan thanh

- Quan ly biet nguon nao gui nhieu ca.
- Biet modality/procedure nao tang giam theo thoi gian.

## I. Drilldown va Export

### Muc tieu

Bien dashboard thanh cong cu hanh dong, khong chi la chart.

### Chuc nang can co

- Click KPI -> danh sach ca da loc.
- Click modality bar -> danh sach ca modality do.
- Click bac si -> danh sach ca cua bac si.
- Click SLA breach -> danh sach ca qua SLA.
- Export CSV/XLSX.
- Luu filter preset.
- Share link dashboard voi filter.

### Dieu kien hoan thanh

- Tat ca KPI van hanh quan trong co drilldown.
- Export khong lo thong tin nhay cam neu role khong du quyen.

## Kien truc du lieu de xuat

## 1. Event log la xuong song

Nen bo sung `ImagingStudyEvent` de ghi moi moc quan trong. Tinh thong ke tu event se ben hon so voi suy luan tu status hien tai.

```prisma
model ImagingStudyEvent {
  id             String   @id @default(uuid())
  imagingStudyId String
  eventType      String
  fromStatus     String?
  toStatus       String?
  actorUserId    String?
  source         String   @default("SYSTEM")
  metadataJson   String?  @db.Text
  createdAt      DateTime @default(now())

  @@index([imagingStudyId])
  @@index([eventType])
  @@index([createdAt])
}
```

Event type de xuat:

- `ORDER_CREATED`
- `PATIENT_CHECKED_IN`
- `SCAN_STARTED`
- `SCAN_ENDED`
- `DICOM_RECEIVED`
- `STUDY_STABLE`
- `QC_PASSED`
- `QC_REJECTED`
- `REPORT_OPENED`
- `REPORT_DRAFTED`
- `REPORT_FINALIZED`
- `RESULT_DELIVERED`
- `ALERT_CREATED`
- `ALERT_ACKNOWLEDGED`

## 2. Cac field can bo sung vao ImagingStudy

```text
siteId
roomId
stationAeTitle
assignedDoctorId
technologistId
priority
orderedAt
checkedInAt
scanStartedAt
scanEndedAt
receivedAt
stableAt
qcCompletedAt
firstOpenedAt
finalizedAt
deliveredAt
```

## 3. Cac aggregate nen cache

Neu so ca tang, khong nen tinh moi thu truc tiep moi lan mo dashboard. Nen co bang/cache theo ngay:

- `DailyStatisticsSnapshot`.
- `HourlyModalityStats`.
- `DoctorDailyStats`.
- `PacsHealthSnapshot`.

Giai doan dau co the query truc tiep DB. Khi data lon moi can snapshot.

## Ke hoach trien khai tung phan

## Giai doan 1: Chuan hoa du lieu va event foundation

### Muc tieu

Tao nen mong de tinh SLA/TAT va audit dung.

### Viec can lam

- [x] Them `ImagingStudyEvent`.
- [x] Bo sung cac moc thoi gian thieu vao `ImagingStudy`.
- [x] Dam bao moi transition quan trong ghi event.
- [x] Backfill event tu du lieu hien co neu co the.
- [x] Tao helper `recordStudyEvent()`.
- [x] Tao helper `getStudyTimeline()`.

Ghi chu 2026-06-21: Da them backfill idempotent theo range dang xem tren `/statistics`, suy luan event tu scheduled/check-in/scan/received/stable/QC/open/final/delivered timestamp neu study chua co event tuong ung.

### Acceptance criteria

- Mot ca tu order den final co timeline doc duoc.
- Status doi o dau cung co event.
- Statistics khong phu thuoc hoan toan vao status hien tai.

## Giai doan 2: Realtime Operations Board

### Muc tieu

Lam man hinh dieu hanh hom nay co gia tri ngay.

### Viec can lam

- [x] Tao tab/route `statistics/operations` hoac section tren `/statistics`.
- [x] Tao API/action aggregate `getOperationsDashboardAction()`.
- [x] Them auto refresh.
- [x] Them KPI theo workflow.
- [x] Them bang stuck workflow.
- [x] Them bang SLA breach.
- [x] Them live queue.
- [x] Them drilldown filter co the click.

Ghi chu 2026-06-21: Da lam drilldown co ban tu tung dong canh bao/queue. Click truc tiep tu KPI de mo danh sach da loc nen lam tiep o giai doan drilldown.

### Acceptance criteria

- Dieu phoi vien nhin thay ca nao can xu ly trong 10 giay.
- Moi so canh bao click duoc ra danh sach ca.

## Giai doan 3: SLA/TAT Analytics

### Muc tieu

Do duoc hieu nang van hanh that su.

### Viec can lam

- [x] Tinh duration tung chang workflow.
- [x] Tinh average, P50, P90, P95.
- [x] Chart TAT theo ngay.
- [x] Breakdown theo modality.
- [x] Breakdown theo priority.
- [x] Drilldown outliers.

Ghi chu 2026-06-21: Da them section SLA/TAT tren `/statistics`, tinh chặng workflow, trend theo ngay, breakdown modality/priority va outlier click ve report.

### Acceptance criteria

- Biet chang nao cham nhat.
- Biet modality/priority nao dang vuot SLA.
- Co danh sach outlier.

## Giai doan 4: Modality / Room Utilization

### Muc tieu

Quan ly nang luc may chup va phong chup.

### Viec can lam

- [x] Dam bao `DicomNode` co `room`, `modality`, `aeTitle`.
- [x] Map study/order vao `stationAeTitle`.
- [x] Ghi `scanStartedAt`, `scanEndedAt` neu co MPPS/manual event.
- [x] Tao utilization chart theo gio.
- [x] Tao ranking may/phong theo so ca.
- [x] Tao no-show/cancel widget.
- [x] Tao QC reject theo may.

Ghi chu 2026-06-21: Da them section utilization tren `/statistics`. Khi chua co MPPS/manual scan event, busy time dung uoc tinh tu scheduled/received hoac default theo modality. Da them action/manual button ghi scan start/end, cap nhat timestamp va event `SCAN_STARTED`/`SCAN_ENDED`.

### Acceptance criteria

- Biet may nao dang qua tai/idle.
- Biet khung gio cao diem.
- Biet phong/may nao co repeat/QC fail cao.

## Giai doan 5: Radiologist Workload Center

### Muc tieu

Dieu phoi backlog doc phim theo bac si.

### Viec can lam

- [x] Them `assignedDoctorId` vao `ImagingStudy`.
- [x] Tao action assign/reassign.
- [x] Ghi event khi assign/reassign.
- [x] Tao workload table theo bac si.
- [x] Tao queue theo bac si.
- [x] Tinh TAT theo bac si.
- [x] Them filter "unassigned".

Ghi chu 2026-06-21: Da them Radiologist Workload tren `/statistics`, gom bang backlog theo bac si, queue assign, dropdown assign/unassign, event va audit log khi doi nguoi phu trach.

### Acceptance criteria

- Thay duoc bac si nao qua tai.
- Reassign ca co audit.
- Queue cua bac si khong bi tron voi queue chung neu role gioi han.

## Giai doan 6: Alert & Escalation

### Muc tieu

Tu dong day cac van de can can thiep len dau.

### Viec can lam

- [x] Them model `OperationalAlert`.
- [x] Tao rule engine server-side.
- [x] Tao cau hinh SLA theo priority.
- [x] Tao alert drawer.
- [x] Them acknowledge/resolved flow.
- [x] Ghi audit khi xu ly alert.
- [x] Lien ket alert voi study/order/node.

Ghi chu 2026-06-21: Da them Alert & Escalation tren `/statistics`. Rule engine sync khi load dashboard, gom SLA breach, stuck workflow, unassigned reading va DICOM node bat thuong. Can tach scheduler nen neu muon alert chay doc lap voi dashboard.

### Acceptance criteria

- Ca qua SLA tu dong co alert.
- Alert xu ly xong khong lap lai vo han.
- Click alert mo dung entity lien quan.

## Giai doan 7: PACS / DICOM Health

### Muc tieu

Theo doi suc khoe he thong PACS va cac node DICOM.

### Viec can lam

- [x] Tao health check Orthanc `/system`.
- [x] Tao storage snapshot tu `/statistics`.
- [x] Tao C-ECHO scheduler cho `DicomNode`.
- [x] Luu health check history.
- [x] Tao widget last received per modality.
- [x] Tao duplicate/missing metadata detector.
- [x] Tao storage forecast.

Ghi chu 2026-06-21: Da them PACS / DICOM Health tren `/statistics`, gom Orthanc `/system`, `/statistics`, C-ECHO cac node active, snapshot history `PacsHealthSnapshot`, last received theo modality/AE, detector thieu PID/accession/modality va duplicate accession. Storage forecast dung `PACS_STORAGE_CAPACITY_MB` hoac `ORTHANC_STORAGE_CAPACITY_MB` neu duoc cau hinh; C-ECHO hien chay theo dashboard refresh, co the tach scheduler doc lap sau.

### Acceptance criteria

- Biet node nao mat ket noi.
- Biet storage con bao nhieu ngay du kien.
- Biet modality nao khong gui anh bat thuong.

## Giai doan 8: Quality & Safety

### Muc tieu

Quan ly chat luong hinh anh, bao cao va rui ro lam sang.

### Viec can lam

- [x] Them `StudyQcEvent`.
- [x] Bat buoc ly do khi QC reject.
- [x] Tao QC dashboard.
- [x] Them critical result model/flow.
- [x] Them addendum tracking.
- [x] Neu co du lieu, ingest dose RDSR/dose tags.

Ghi chu 2026-06-21: Da them Quality & Safety tren `/statistics`, gom QC reject rate/ly do/recent list, missing critical data, critical result pending communication, action tao/danh dau critical result da thong bao, addendum tracking khi sua report da final/completed, model/action `DoseObservation` va dose outlier dashboard. Nguon RDSR/dose tag co the day vao `recordDoseObservationAction()`.

### Acceptance criteria

- QC reject co ly do va chart.
- Critical result co trang thai communication.
- Addendum rate theo bac si/modality xem duoc.

## Giai doan 9: Business / Referral Analytics

### Muc tieu

Ho tro quan ly san luong va nguon gui benh.

### Viec can lam

- [x] Chuan hoa `referringPhysician`.
- [x] Them source/facility neu can.
- [x] Them procedure code mapping.
- [x] Tao chart theo nguon gui.
- [x] Tao chart modality/procedure mix.
- [x] Them export CSV/XLSX.

Ghi chu 2026-06-21: Da them Business / Referral Analytics tren `/statistics`, chuan hoa bucket referring physician/source/department khi aggregate, bo sung field `referringDepartment`, `sourceFacility`, `price`, `paymentStatus`, model `ProcedureCatalog`, chart nguon gui/khoa/facility/modality/procedure/trend va export dung drilldown CSV/XLSX.

### Acceptance criteria

- Quan ly biet nguon gui nao tang/giam.
- Biet dich vu nao chiem ty trong cao.

## Giai doan 10: Drilldown, Export va UX hoan thien

### Muc tieu

Lam dashboard thanh cong cu hanh dong hang ngay.

### Viec can lam

- [x] Tao component drilldown table dung chung.
- [x] Moi KPI co filter link.
- [x] Them saved filters.
- [x] Them export theo quyen.
- [x] Them empty/loading/error states ro rang.
- [x] Toi uu query va index.

Ghi chu 2026-06-21: Da them drilldown table dung chung tren `/statistics`, KPI/modality/business row click de loc danh sach ca, saved filter preset theo user/shared, export CSV/XLSX an thong tin nhay cam neu user khong co `reports.read`, empty/loading/error states cho cac panel moi va index cho cac cot query moi.

### Acceptance criteria

- Khong co KPI "chet" khong click duoc.
- Export dung data dang loc.
- Dashboard tai nhanh voi data thuc te.

## Thu tu uu tien khuyen nghi

1. Event foundation.
2. Realtime Operations Board.
3. SLA/TAT Analytics.
4. Drilldown cho KPI quan trong.
5. Radiologist Workload.
6. PACS/DICOM Health.
7. Modality/Room Utilization.
8. Alert & Escalation.
9. Quality & Safety.
10. Business/Referral Analytics.

Ly do: 4 muc dau cho gia tri dieu hanh ngay va tao nen mong du lieu. Cac muc sau can du lieu sau hon va co the lam theo tung dot.

## Rui ro va luu y

### Rui ro 1: Thieu moc thoi gian

Neu khong co MPPS hoac manual scan start/end, utilization se chi uoc tinh. Can cho phep giai doan dau dung event manual tu ky thuat vien.

### Rui ro 2: Du lieu status khong dong nhat

Can bat buoc moi thay doi trang thai qua service chung, khong update DB truc tiep trong tung page/action.

### Rui ro 3: Dashboard cham khi data lon

Can them index va sau nay snapshot theo ngay/gio.

### Rui ro 4: Role va thong tin nhay cam

Thong ke bac si, doanh thu, nguon gui benh can permission rieng. Khong nen mac dinh mo cho le tan/ky thuat vien.

### Rui ro 5: Alert qua nhieu

Neu rule qua nhay, user se bo qua alert. Can co threshold va acknowledge/resolution dung.

## Index DB nen co

- `ImagingStudy.status`
- `ImagingStudy.modality`
- `ImagingStudy.priority`
- `ImagingStudy.stationAeTitle`
- `ImagingStudy.assignedDoctorId`
- `ImagingStudy.receivedAt`
- `ImagingStudy.finalizedAt`
- `ImagingStudy.deliveredAt`
- `ImagingStudyEvent.imagingStudyId`
- `ImagingStudyEvent.eventType`
- `ImagingStudyEvent.createdAt`
- `OperationalAlert.status`
- `OperationalAlert.severity`
- `OperationalAlert.createdAt`

## Ket luan

Huong di dung la bien `Statistics` thanh 3 lop:

1. `Operations`: dieu hanh realtime va canh bao.
2. `Performance`: SLA/TAT, workload, utilization.
3. `Quality/System`: QC, critical result, PACS/DICOM health, storage.

Nen bat dau bang event foundation va Operations Board. Khi da co timeline du lieu tot, cac thong ke nang cao se tinh chinh xac va it phai refactor lai.
