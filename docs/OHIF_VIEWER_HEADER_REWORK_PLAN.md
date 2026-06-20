# Ke hoach moi: xoa nut Lua chon va tao nut Ngon ngu tren toolbar OHIF viewer

Ngay cap nhat: 2026-06-20

## Muc tieu cuoi

Don gian hoa viewer OHIF va tang dien tich xem anh bang cach bo hoan toan nut `Lua chon` hien tai, sau do tao mot nut moi ten `Ngon ngu` o hang toolbar ben duoi. Nut moi chi dung cho viec doi ngon ngu giao dien viewer.

Trang thai mong muon:

- Xoa hoan toan nut `Lua chon` o hang header tren cung.
- Khong con menu `User Preferences` mac dinh cua OHIF tren viewer.
- Tao nut moi hien thi la `Ngon ngu` tren hang toolbar ben duoi.
- Nut `Ngon ngu` nam ben phai toolbar, gan khu vuc `Measurements`.
- Nut `Ngon ngu` chi mo menu chon ngon ngu.
- Menu ngon ngu chi co cac lua chon ngon ngu can dung, vi du:
  - `Tieng Viet`
  - `English`
- Khi doi ngon ngu, chi thay doi ngon ngu giao dien viewer.
- Khong thay doi DICOMweb config, khong thay doi route viewer, khong anh huong viec load anh.
- Hang header tren cung duoc bo/collapse neu sau khi xoa `Lua chon` khong con noi dung can dung.

## Ly do doi huong

Huong di chuyen nut `Lua chon` xuong toolbar khong phu hop vi nut nay la mot phan cua menu Preferences mac dinh OHIF. Khi dua xuong bang CSS/DOM patch, menu co the mat anchor, bi lech vi tri, day layout hoac tao khoang trong bat thuong.

Can bo han `Lua chon` thay vi tiep tuc co gang di chuyen no. Nhu vay viewer se gon hon va tranh keo theo toan bo logic Preferences mac dinh cua OHIF.

## Nguyen tac bat buoc

AI thuc hien tiep theo can tuan thu:

- Khong di chuyen nut `Lua chon` nua.
- Khong dung `position: fixed` de dat nut moi.
- Khong clone nut `Lua chon`.
- Khong tai su dung menu `User Preferences` mac dinh neu no keo theo nhieu setting khong can.
- Nut `Ngon ngu` phai la nut moi, logic moi, chi phuc vu doi ngon ngu.
- Nut `Ngon ngu` phai nam trong toolbar row that su, khong nam tren header tren cung.
- Neu co the, sua o cap React component/layout cua OHIF.
- Neu bat buoc dung runtime patch tren OHIF build san, patch phai gioi han, it selector, khong quet text toan trang lien tuc.

## Pham vi can lam

Can lam:

- An hoac bo render nut `Lua chon`.
- Bo/collapse hang header tren cung neu hang do khong con noi dung.
- Them nut `Ngon ngu` vao toolbar row.
- Tao menu ngon ngu nho cho nut `Ngon ngu`.
- Khi chon ngon ngu, goi co che i18n hien co cua OHIF neu co.
- Luu ngon ngu da chon vao localStorage neu viewer can giu ngon ngu sau refresh.
- Refresh hoac re-render nhan ngon ngu moi neu OHIF yeu cau.

Khong lam:

- Khong them lai cac tuy chon Preferences cu.
- Khong them setting Theme, Hotkeys, About, Reset Preferences.
- Khong sua flow load DICOM.
- Khong sua Orthanc, Nginx DICOMweb, dashboard route neu khong lien quan.

## Vi tri UI de dat nut Ngon ngu

Vi tri khuyen nghi:

- Tren hang toolbar ben duoi.
- Nam ben phai toolbar.
- Dat gan nut `Measurements`.
- Uu tien nam ben trai `Measurements`.
- Neu toolbar co right action group, chen `Ngon ngu` vao group do.

Vi tri khong nen dat:

- Khong dat o hang header tren cung.
- Khong dat trong viewport anh.
- Khong dat trong thumbnail panel trai.
- Khong dat trong panel `Measurements`.
- Khong dat vao menu `Them` neu nguoi dung can thay doi ngon ngu nhanh.

## Thiet ke nut Ngon ngu

Label hien thi:

- `Ngon ngu`

Neu codebase ho tro tieng Viet co dau va encoding on dinh, label UI nen hien thi:

- `Ngôn ngữ`

Icon de xuat:

- Icon globe/language neu OHIF co icon san.
- Neu khong co icon phu hop, co the dung nut text ngan gon `Ngon ngu`.

Menu khi bam:

- Mo dropdown nho ngay duoi nut.
- Chi co danh sach ngon ngu.
- Co checkmark cho ngon ngu dang dung neu co component san.
- Dong menu khi chon xong hoac click ra ngoai.

Lua chon ngon ngu toi thieu:

- `Tieng Viet`
- `English`

## Huong trien khai khuyen nghi

## Buoc 1: Inspect co che i18n cua OHIF hien tai

Can xac dinh:

- OHIF dang dung thu vien i18n nao.
- Doi ngon ngu hien tai duoc luu o dau.
- Co ham nao tuong duong `i18n.changeLanguage(...)` khong.
- Translation resources cua `vi` va `en` dang nam o dau.
- Viewer hien tai co load san tieng Viet hay dang dung custom translation bundle.

Tu khoa nen search:

- `i18n`
- `changeLanguage`
- `language`
- `locale`
- `localStorage`
- `User Preferences`
- `Preferences`
- `vi`
- `en`

Tieu chi qua buoc 1:

- Biet cach doi ngon ngu bang API noi bo OHIF.
- Biet co can reload viewer sau khi doi ngon ngu hay khong.
- Biet key localStorage neu OHIF da co key ngon ngu san.

## Buoc 2: Xoa hoac an nut Lua chon

Uu tien:

- Neu sua source OHIF: bo render component user/preferences menu tren viewer header.
- Neu patch build san: an dung node `Lua chon` bang selector gioi han trong top header.

Khong nen:

- Khong di chuyen node `Lua chon`.
- Khong de node con ton tai nhung nam ngoai man hinh.
- Khong dung CSS toa do am.

Tieu chi qua buoc 2:

- Khong con thay nut `Lua chon`.
- Bam vao khu vuc goc phai tren khong mo Preferences nua.
- Khong co loi console.

## Buoc 3: Them nut Ngon ngu vao toolbar row

Uu tien:

- Neu sua source OHIF: them component button vao toolbar/right toolbar group.
- Neu patch build san: tao mot button moi va append vao toolbar container da inspect.

Yeu cau button:

- Button co text `Ngon ngu` hoac `Ngôn ngữ`.
- Button co aria-label ro rang.
- Button co style dong bo voi toolbar OHIF.
- Button khong lam thay doi layout cac tool hien co.
- Button khong che len `Measurements`.

Tieu chi qua buoc 3:

- Nut moi nam cung hang voi cac tool.
- Nut moi o ben phai, gan `Measurements`.
- Toolbar khong bi cao hon bat thuong.

## Buoc 4: Tao menu doi ngon ngu

Menu can don gian:

- Bam `Ngon ngu` thi mo dropdown.
- Chon `Tieng Viet` thi doi viewer sang tieng Viet.
- Chon `English` thi doi viewer sang tieng Anh.
- Sau khi chon, menu dong lai.
- Neu OHIF can reload de ap dung ngon ngu, hien tuong reload phai nhanh va khong mat route viewer.

Uu tien dung API i18n san co:

- Goi ham doi ngon ngu cua OHIF neu co.
- Cap nhat localStorage theo key OHIF dang dung.
- Re-render viewer theo co che OHIF.

Neu bat buoc reload:

- Luu ngon ngu vao localStorage truoc.
- Reload lai dung URL viewer hien tai.
- Dam bao sau reload van o dung study dang xem.

Tieu chi qua buoc 4:

- Doi qua lai giua `Tieng Viet` va `English` duoc.
- Nut toolbar doi label neu translation co ho tro.
- Khong mat anh dang xem.
- Khong quay lai StudyList.

## Buoc 5: Bo/collapse hang header tren cung

Chi lam sau khi nut `Lua chon` da bien mat va nut `Ngon ngu` da hoat dong.

Can lam:

- Inspect container header tren cung.
- Neu header khong con noi dung, collapse chieu cao ve 0 hoac bo render.
- Xoa margin/padding/border con lai.
- Dam bao toolbar tro thanh hang dau tien cua viewer.
- Dam bao viewport anh tang chieu cao.

Tieu chi qua buoc 5:

- Khong con khoang trong phia tren toolbar.
- Toolbar nam sat dau viewer.
- Vung anh cao hon truoc.
- Khong lech thumbnail panel va Measurements panel.

## Kiem thu bat buoc

Kiem thu giao dien:

- Mo viewer tu dashboard bang double click.
- Mo truc tiep `/viewer/<StudyInstanceUID>`.
- Khong con nut `Lua chon`.
- Co nut `Ngon ngu` tren toolbar.
- Hang header tren cung da bien mat neu khong con noi dung.
- Viewer khong co khoang trong bat thuong.

Kiem thu doi ngon ngu:

- Bam `Ngon ngu`.
- Menu ngon ngu mo dung vi tri.
- Chon `English`.
- Viewer doi sang tieng Anh.
- Bam `Ngon ngu` lai.
- Chon `Tieng Viet`.
- Viewer doi sang tieng Viet.
- Refresh trang, ngon ngu da chon van duoc giu neu yeu cau co persistence.

Kiem thu layout:

- 1920x1080.
- 1440x900.
- 1366x768.
- Neu co the, test gan 1280px.

Kiem thu regression:

- Anh DICOM van load.
- Metadata va frame van request qua `/dicom-web`.
- Thumbnail panel trai van dung.
- Panel `Measurements` van mo/dong duoc.
- Cac tool Zoom, Window Level, Pan, Angle, Reset van dung.
- Khong co loi console moi.

## Checklist rollback neu loi

Neu nut `Ngon ngu` lam viewer loi:

1. Bo nut `Ngon ngu` moi.
2. Khoi phuc header tren neu da collapse.
3. Tam thoi giu viewer khong co nut ngon ngu cho den khi inspect lai i18n.
4. Khong khoi phuc `Lua chon` neu muc tieu van la xoa no, tru khi can rollback toan bo.
5. Hard refresh browser bang `Ctrl + F5`.

Neu doi ngon ngu gay loi:

1. Bo logic doi ngon ngu.
2. Giu button an hoac disable tam thoi.
3. Xac dinh lai API i18n dung cua OHIF.
4. Khong dung string replace tren DOM de dich UI.

## Tieu chi hoan thanh

Chi xem la hoan thanh khi:

- Nut `Lua chon` da bi xoa hoan toan.
- Nut `Ngon ngu` nam tren hang toolbar duoi, gan `Measurements`.
- Nut `Ngon ngu` chi dung de doi ngon ngu.
- Doi ngon ngu qua lai hoat dong.
- Header tren khong con chiem dien tich.
- Dien tich xem anh duoc toi uu hon.
- Viewer van load anh binh thuong.
- Khong co loi console moi.

## Ghi chu cho AI tiep theo

Muc tieu moi la thay the chuc nang, khong phai di chuyen nut cu. Hay bo `Lua chon` va menu Preferences mac dinh. Tao nut `Ngon ngu` rieng, nho gon, nam trong toolbar, chi noi vao co che i18n cua OHIF.
