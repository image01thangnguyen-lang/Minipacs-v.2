# VRPACS - MiniPACS Terminology Map

Updated: 2026-07-03

## 1. Muc dich

Tai lieu nay chot cach goi thuat ngu giua VRPACS va MiniPACS de cac phase sau khong tao logic song song. Khi code, docs, UI, backlog, va prompt AI khac noi ve cung mot khai niem, uu tien dung `Canonical term`.

Pham vi:

- DICOM/RIS workflow.
- Report lifecycle.
- HIS sync.
- Viewer artifacts.
- Admin catalogs.
- Share/consultation.
- Export/download/destructive operations.

## 2. Quy tac dat ten

- `Order` la yeu cau chi dinh/lich hen truoc khi anh DICOM ve.
- `Study` la ca chup da co hoac se co anh DICOM gan voi `StudyInstanceUID`.
- `Report` la phieu ket qua gan voi study.
- `Final` la report da ky/chot, khong duoc sua im lang.
- `Delivered` la da tra ket qua cho ben nhan/phong kham/benh nhan.
- `Archive` la kho tra cuu ket qua da final/delivered, khong phai xoa anh.
- `Cancel` phai noi ro cancel cai gi: order, draft report, final approval, consult, share, export job.
- `Delete` la thao tac destructive tren anh/file/data, phai co guardrail rieng.

## 3. Mapping thuat ngu chinh

| Canonical term | VRPACS term/label | MiniPACS code/model | Ghi chu |
| --- | --- | --- | --- |
| Worklist order | Phieu chi dinh, order, form | `WorklistOrder` | Tao MWL va thong tin benh nhan/chi dinh truoc khi modality chup |
| Accession number | Ma chi dinh, record code | `accessionNumber` | Key lien ket order-study-HIS |
| Imaging study | Ca chup, exam, study | `ImagingStudy` | Gan voi `studyInstanceUid` |
| StudyInstanceUID | Study UID | `studyInstanceUid` | DICOM primary identifier cho viewer/Orthanc |
| Series | Series anh | DICOM series UID | Don vi trong viewer, co the export/delete guarded |
| Instance | Image/frame/SOP | SOP Instance UID | Anh/frame rieng le |
| Patient ID | Ma benh nhan | `patientId` | PHI, can scrub khi export anonymized |
| Patient name | Ten benh nhan | `patientName` | PHI |
| Modality | Loai may chup | `modality`, `DicomNode.modality` | CT/MR/US/DX/CR... |
| Scheduled station AE | May chup/AET | `scheduledStationAeTitle`, `DicomNode.aeTitle` | Dung cho MWL va machine permissions |
| Procedure | Dich vu ky thuat, technical service | `ProcedureCatalog` | Phase 3 mo rong |
| Service type | Loai dich vu | `ServiceTypeCatalog` de xuat | Phase 3 |
| Body part | Bo phan chup | `bodyPart`, `bodyPartExamined` | Dung cho template/layout |
| Clinical info | Thong tin lam sang | `clinicalInfo` de xuat/metadata | Phase 1/2 |
| Indication | Chi dinh | procedure/indication field de xuat | Khong tron voi conclusion |
| Technologist | Ky thuat vien | `technologistId` de xuat | Phase 1 |
| Assigned doctor | Bac si duoc gan doc | `assignedDoctorId` | Trong `ImagingStudy` |
| Reading doctor | Bac si doc/ky | `Report.doctorId` | Doctor cua report |
| Receive/read | Nhan doc, bat dau doc | status transition to `READING` | Phase 1 |
| Draft report | Ban nhap/luu nhap | `Report.status = DRAFT` | Chua gui HIS |
| Final report | Ky/chot ket qua | `Report.status = FINAL` hoac equivalent | Can audit va lock |
| Approval | Duyet/ky ket qua | Finalize report | 1-step neu bac si chuyen mon; 2-step neu bac si khong chuyen mon can duyet lai. Ho tro ca 2 mode |
| Cancel approval | Huy duyet/huy ky | Unfinalize/addendum policy | Can reason, permission, audit |
| Cancel form | Huy phieu/huy report form | Cancel draft/order | Ap dung cho CA HAI order va report draft. Phai noi ro target |
| Addendum | Bo sung sau final | `ReportAddendum` | Khong ghi de im lang |
| Delivered | Tra ket qua | Archive delivered action | `archive.deliver` |
| Archive | Luu/truy van ket qua | `/archive` | Khong dong nghia xoa anh |
| HIS update | Cap nhat tu HIS | Phase 2 `HisSyncService` | Pull demographics/order/clinical info |
| HIS result send | Gui ket qua sang HIS | Phase 2 outbound | Chi gui final report |
| HIS sync status | Trang thai dong bo HIS | `hisSyncStatus` de xuat | pending/sent/failed/skipped/disabled |
| Viewer key image | Anh key | `ViewerKeyImage` | Reference/thumbnail gan study |
| Viewer snapshot | Anh chup man hinh | `ViewerSnapshot` | Capture/crop/fullview |
| Measurement | Do dac | `ViewerMeasurement` | JSON-first persistence |
| Report workspace | Du lieu viewer gui sang report | viewer report-workspace APIs | Measurements/key images/snapshots |
| Action history | Lich su thao tac viewer | `ViewerAuditLog` | Phase 4 UI |
| Share link | Link chia se | Phase 7 | Public/read-only, expiry/password/QR |
| Consultation | Hoi chan | Phase 7 | Consult request/room/chat/video |
| Download job | Yeu cau export/download | `ViewerDownloadJob` de xuat | Phase 4/8 |
| Encode patient | Ma hoa thong tin nguoi benh | display/viewer encode mode | Ma hoa/an thong tin BN tren man hinh, khong sua data goc. Khac voi anonymize export |
| Delete study | Xoa ca chup | Phase 8 guarded | Destructive, khong nam Phase 1-4 |
| Delete series | Xoa series | Phase 8 guarded | Phase 4 chi request/dry-run neu can |
| Retention cleanup | Don dep luu tru | Phase 8 | Theo policy, audit |
| Native companion | Ung dung may tram | Phase 9 | Open folder, CD burn, scanner, DICOM print |

## 4. Status terms

| Canonical status | Y nghia | Dung trong |
| --- | --- | --- |
| `REQUESTED` | Order moi tao, chua check-in/chua chup | Worklist order |
| `SCHEDULED` | Da len lich/chuan bi MWL | Worklist order |
| `ARRIVED` | Benh nhan da den/check-in | Worklist order |
| `IN_PROGRESS` | Dang chup/dang xu ly | Worklist/study |
| `RECEIVED` | Anh DICOM da ve PACS | Study |
| `READY_TO_READ` | San sang bac si doc | Study |
| `READING` | Da nhan doc/dang doc | Study/report |
| `DRAFT` | Report dang nhap | Report |
| `FINAL` | Report da ky/chot | Report |
| `ADDENDUM` | Co bo sung sau final | Report addendum |
| `DELIVERED` | Da tra ket qua | Archive/result delivery |
| `ARCHIVED` | Da vao luu tru tra cuu | Study/archive |
| `CANCELLED` | Da huy | Order/report/consult/job, phai co target |
| `FAILED` | Loi xu ly/dong bo/job | HIS/export/job |

## 5. Action naming rules

| Action phrase | Nen dung khi | Khong dung khi |
| --- | --- | --- |
| `create order` | Tao order/worklist | Tao report |
| `check in` | Benh nhan den | Anh DICOM ve |
| `sync study` | Dong bo Orthanc -> DB | Gui HIS |
| `update from HIS` | Pull HIS inbound | Update clinical thu cong |
| `send result to HIS` | Push final report | Luu draft |
| `start reading` | Lock/nhan doc | Mo viewer chi de xem |
| `save draft` | Luu report chua final | Finalize |
| `finalize report` | Ky/chot report | Mark delivered |
| `unfinalize report` | Huy duyet/chinh sua sau final | Delete report |
| `mark delivered` | Da tra ket qua | Finalize |
| `export` | Tao file/ZIP/PDF/JPEG/DICOM | Share public link |
| `share` | Tao link/chia se read-only | Export local file |
| `delete` | Xoa resource | Cancel workflow |

## 6. Ambiguous terms can xu ly can than

| Term | Ambiguity | Rule |
| --- | --- | --- |
| Form | Co the la order form hoac report form | Trong UI/code phai noi `order form` hoac `report form` |
| Approve | Co the la final report hoac admin approval | Trong clinical workflow map vao `finalize report` |
| Cancel | Co the huy order, draft, final approval, consult, share, job | Ten action phai co target |
| Archive | Co the la tra cuu hay luu tru anh | Khong dung de chi delete/retention |
| Encode | Co the anonymize hoac ma hoa file | Trong Phase 4 dung `anonymize export`, khong sua source |
| Machine | Co the DICOM node, modality, room | Trong code: DICOM node = `DicomNode`, modality = CT/MR/US |

## 7. Source of truth theo module

| Module | Source of truth hien tai | Ghi chu |
| --- | --- | --- |
| Permission global | `dashboard/lib/permissions.ts` | Phase 3/4 co the mo rong |
| Order/worklist | `WorklistOrder`, `/worklist` | Phase 1 mo rong |
| Study status | `ImagingStudy.status`, `dashboard/lib/studyStatus.ts` | Khong update status rai rac |
| Report | `Report`, `ReportAddendum`, report actions | Final/edit policy can audit |
| HIS sync | Phase 2 `HisSyncService` de xuat | Adapter-first |
| Admin catalogs | `ProcedureCatalog`, `ReportTemplateText`, `PrintTemplate`, `DicomNode` | Phase 3 mo rong |
| Viewer tools | `minipacsToolRegistry.ts` | Registry la contract |
| Viewer artifacts | `ViewerMeasurement`, `ViewerKeyImage`, `ViewerSnapshot` | JSON-first |
| Viewer audit | `ViewerAuditLog`, `/api/audit/viewer-action` | Phase 4 action history |
| Export/download | Phase 4/8 `ViewerDownloadJob` de xuat | Job-based |
| Destructive ops | Phase 8 policy | Guarded only |

## 8. Resolved validation items (2026-07-03)

- `duyet` = finalize report, nhung co 2 mode: 1-step (bac si chuyen mon tu duyet) va 2-step (bac si khong chuyen mon can nguoi khac duyet lai). Ho tro ca 2.
- `huy phieu` ap dung cho CA HAI: cancel order va cancel report draft.
- HIS order code va accession number LA MOT. Canonical term: `accessionNumber`.
- `encode patient` = ma hoa thong tin nguoi benh tren man hinh (display mask), khong phai anonymize export file.
- Non-anonymized DICOM export: dua vao PHAN QUYEN (`viewer.export`), khong fix role. Role nao co permission moi duoc export.
- Retention duration: 10 NAM cho DICOM images va report data.
- Report PDF filename: dung ma/ID (accession, study UID short), KHONG chua ten benh nhan.
- `delivered` timing: mark SAU khi gui HIS thanh cong. Ngoai le: neu HIS loi ket noi, cho phep bypass delivered voi reason/audit.
- Share link default: KHONG an thong tin BN mac dinh. Co option toggle de nguoi dung chon an neu can.
- Audit retention: 10 NAM (giong DICOM/report retention).

> Tat ca open items da resolve. Phase 1+ co the bat dau code.
