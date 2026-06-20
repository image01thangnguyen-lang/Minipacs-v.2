# Ke hoach doi mau theo phong cach Vinmec dark teal

Ngay tao: 2026-06-20

## Design read

Day la giao dien PACS/RIS va viewer cho moi truong y te, du lieu day, can doc nhanh va lam viec lau. Huong mau nen la dark teal clinical: nen xanh den, panel xanh dau, accent cyan, text trang ro, status mau vua du nhan biet nhung khong choi.

Day khong phai landing page. Khong dung gradient trang tri, glassmorphism, orb, hero hay mau qua ruc. Uu tien do tuong phan, do ben khi nhin lau va tinh dong nhat giua dashboard va viewer.

## Muc tieu

Doi bo mau hien tai cua Mini PACS sang tong mau giong anh tham chieu:

- Top bar xanh den dam.
- Sidebar xanh den sau hon main.
- Main content xanh than/xanh dau.
- Bang du lieu mau xanh slate-teal, row hover/selected ro nhung khong gay choi.
- Accent chinh la cyan/teal sang.
- Text trang va xanh nhat de doc tot tren nen toi.
- Badge trang thai dung xanh la, xam xanh, vang/cam, do nhung phai nam trong cung he mau.
- Viewer OHIF neu co custom UI cung nen theo cung palette.

## Bang mau de xuat

Lay cam hung tu anh tham chieu, dung palette xap xi sau:

```css
:root {
  --vin-bg-root: #081f2a;
  --vin-bg-shell: #0a2a38;
  --vin-bg-sidebar: #062536;
  --vin-bg-panel: #1f3037;
  --vin-bg-panel-2: #243d48;
  --vin-bg-table: #2b5669;
  --vin-bg-table-alt: #2a5162;
  --vin-bg-table-hover: #34687c;
  --vin-bg-table-selected: #3b7188;

  --vin-border-subtle: #315060;
  --vin-border-strong: #4f7282;

  --vin-text-primary: #ffffff;
  --vin-text-secondary: #d8edf4;
  --vin-text-muted: #8fb2bf;
  --vin-text-faint: #648694;

  --vin-accent: #18b9d0;
  --vin-accent-hover: #23cbe3;
  --vin-accent-soft: #0f8395;

  --vin-status-new-bg: #5b7183;
  --vin-status-new-text: #ffffff;
  --vin-status-approved-bg: #6fa34a;
  --vin-status-approved-text: #ffffff;
  --vin-status-warning-bg: #b78b36;
  --vin-status-danger-bg: #b84a4a;
}
```

Co the tinh lai mau bang cong cu contrast, nhung khong nen di lech khoi nhom dark teal tren.

## Pham vi can doi

Dashboard Next.js:

- `dashboard/app/globals.css`
- `dashboard/tailwind.config.js`
- `dashboard/app/page.tsx`
- `dashboard/app/login/page.tsx`
- `dashboard/app/worklist/new/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- Cac component report/editor neu co mau rieng.

OHIF viewer custom layer:

- `config/ohif-custom.css`
- `config/ohif-custom.js` neu co tao button UI moi.
- Khong sua `config/app-config.js` neu chi doi mau.
- Khong sua DICOMweb endpoint.

## Nguyen tac trien khai

- Tao token mau truoc, sau do moi thay class.
- Khong tiep tuc hardcode nhieu mau moi truc tiep trong JSX.
- Neu dung Tailwind, them mau vao `dashboard/tailwind.config.js` voi namespace `vin`.
- Neu chua muon sua Tailwind, dat CSS variables trong `dashboard/app/globals.css` va dung class arbitrary theo token.
- Giu mot accent duy nhat la cyan/teal.
- Khong dung blue-600 lam mau chinh nua, doi sang cyan/teal cua palette.
- Khong bien toan bo app thanh mot mau duy nhat. Can co phan cap: root, sidebar, panel, table, hover, selected.
- Trang thai nghiep vu duoc phep co mau rieng, nhung phai giam saturation de hop nen toi.

## Buoc 1: Audit mau hien tai

Tim toan bo mau dang hardcode:

```powershell
Select-String -Path dashboard\app\**\*.tsx -Pattern "bg-|text-|border-|blue|slate|zinc|emerald|amber|red|#"
Select-String -Path dashboard\app\**\*.css -Pattern "#|rgb|hsl|blue|slate|zinc|emerald|amber|red"
```

Can lap danh sach:

- Mau nen app.
- Mau top/header.
- Mau sidebar.
- Mau panel.
- Mau table header.
- Mau table row.
- Mau selected row.
- Mau input/select.
- Mau button primary.
- Mau button secondary.
- Mau badge trang thai.
- Mau error/success.

Tieu chi qua buoc 1:

- Biet file nao dang chua mau.
- Biet mau nao can thay bang token.
- Khong bo sot login/worklist/report page.

## Buoc 2: Tao token mau chung

Trong `dashboard/app/globals.css`, them CSS variables `--vin-*`.

Neu muon dung Tailwind dep hon, them vao `dashboard/tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      vin: {
        root: 'var(--vin-bg-root)',
        shell: 'var(--vin-bg-shell)',
        sidebar: 'var(--vin-bg-sidebar)',
        panel: 'var(--vin-bg-panel)',
        panel2: 'var(--vin-bg-panel-2)',
        table: 'var(--vin-bg-table)',
        tableAlt: 'var(--vin-bg-table-alt)',
        tableHover: 'var(--vin-bg-table-hover)',
        tableSelected: 'var(--vin-bg-table-selected)',
        border: 'var(--vin-border-subtle)',
        borderStrong: 'var(--vin-border-strong)',
        accent: 'var(--vin-accent)',
        accentHover: 'var(--vin-accent-hover)',
        text: 'var(--vin-text-primary)',
        text2: 'var(--vin-text-secondary)',
        muted: 'var(--vin-text-muted)',
        faint: 'var(--vin-text-faint)',
      },
    },
  },
}
```

Tieu chi qua buoc 2:

- Co mot nguon mau duy nhat.
- Khong can nho hex trong JSX.
- Doi palette sau nay chi sua token.

## Buoc 3: Doi mau layout dashboard chinh

Ap dung cho `dashboard/app/page.tsx`.

Mapping de xuat:

- App root: `--vin-bg-root`.
- Left pane / shell: `--vin-bg-shell`.
- Right report pane: `--vin-bg-panel`.
- Borders: `--vin-border-subtle`.
- Table header: `--vin-bg-panel-2`.
- Table row: `--vin-bg-table`.
- Table alternate row: `--vin-bg-table-alt`.
- Table hover: `--vin-bg-table-hover`.
- Selected row: `--vin-bg-table-selected` + left border accent cyan.
- Text primary: `--vin-text-primary`.
- Text secondary: `--vin-text-secondary`.
- Text muted: `--vin-text-muted`.
- Focus ring/input active: `--vin-accent`.

Can giu do doc:

- Ten benh nhan va ngay gio phai ro nhat.
- Metadata phu dung muted.
- Row selected phai nhan ra ngay.
- Hover khong duoc gan giong selected.

## Buoc 4: Doi mau login

Ap dung cho `dashboard/app/login/page.tsx`.

Muc tieu:

- Login cung tone voi dashboard.
- Nen root xanh den thay vi gan den/blue gradient.
- Icon/logo chinh doi tu blue sang cyan/teal.
- Card login dung `--vin-bg-panel`.
- Input dung `--vin-bg-shell` hoac `--vin-bg-panel-2`.
- Focus ring dung `--vin-accent`.
- Button primary dung `--vin-accent`, hover `--vin-accent-hover`.

Khong nen:

- Khong dung blue-600 lam CTA.
- Khong dung rounded qua lon neu cac trang khac dang goc nho.
- Khong them gradient trang tri moi.

## Buoc 5: Doi mau worklist/report pages

Ap dung cho:

- `dashboard/app/worklist/new/page.tsx`
- `dashboard/app/report/[studyInstanceUid]/page.tsx`
- Cac component editor/print preview neu co mau nen trong app.

Mapping:

- Form background: `--vin-bg-panel`.
- Input/select: `--vin-bg-shell`.
- Label: `--vin-text-muted`.
- Text input: `--vin-text-primary`.
- Border: `--vin-border-subtle`.
- Primary action: `--vin-accent`.
- Success: `--vin-status-approved-bg`.
- Error: `--vin-status-danger-bg`.
- Warning/draft: `--vin-status-warning-bg`.

## Buoc 6: Doi mau status badge

Can chuan hoa badge:

- `MOI`: xam xanh, chu trang.
- `DA DUYET`: xanh la Vinmec-style, chu trang.
- `DRAFT/DRAFTING`: vang/cam muted.
- `COMPLETED/FINAL`: xanh la.
- Loi: do muted.

Khong nen dung badge qua neon. Anh tham chieu dung badge xanh la kha mem va de doc.

## Buoc 7: Doi mau OHIF viewer custom UI neu can

Neu viewer dang co custom button/header:

- Toolbar/overlay nen tiep tuc dark teal, khong phai den thuan.
- Accent OHIF cyan hien tai co the gan voi `--vin-accent`.
- Nut `Ngon ngu` neu duoc tao sau nay nen dung cung accent.
- Khong can doi mau anh DICOM, viewport anh nen giu den de doc phim.

Luu y:

- Khong sua DICOM rendering.
- Khong doi window/level default.
- Khong lam overlay text tren anh qua sang.

## Buoc 8: Kiem tra contrast va kha nang doc

Can kiem tra:

- Text chinh tren panel dat WCAG AA.
- Placeholder input du doc nhung khong tranh voi text that.
- Header table ro tren nen table.
- Badge chu trang doc duoc tren mau badge.
- Button disabled nhin ro la disabled.
- Focus ring thay duoc tren nen dark teal.

Can test thuc te bang 3 man hinh:

- 1920x1080.
- 1440x900.
- 1366x768.

## Buoc 9: Kiem thu regression

Dashboard:

- Dang nhap duoc.
- Danh sach ca chup hien dung.
- Search/filter van dung.
- Double click mo OHIF viewer van dung.
- Chon ca chup van load report pane.
- Save draft/final van dung.
- Upload/worklist form van dung.

Viewer:

- Anh DICOM van load.
- Toolbar khong bi lech.
- Thumbnail panel va Measurements panel khong bi mat.
- Neu co nut `Ngon ngu`, nut nay van dung mau va khong lech layout.

## Thu tu thuc hien de it rui ro

1. Tao token mau trong `globals.css`.
2. Them mau `vin` vao `tailwind.config.js` neu dung Tailwind token.
3. Doi login truoc vi it lien quan nghiep vu.
4. Doi dashboard main.
5. Doi worklist/report pages.
6. Doi OHIF custom UI neu co.
7. Chay build/test.
8. Chup screenshot truoc/sau de so sanh.
9. Chinh contrast cuoi cung.

## Tieu chi hoan thanh

Chi coi la xong khi:

- App co tone dark teal gan voi anh tham chieu.
- Mau dong nhat giua login, dashboard, worklist/report va custom viewer UI.
- Khong con blue-600/blue-500 lam accent chinh.
- Table nhin giong he RIS/PACS chuyen nghiep, khong qua toi va khong qua neon.
- Text quan trong doc tot khi bac si lam viec lau.
- Khong lam hong luong dang nhap, danh sach ca chup, report va mo OHIF.

## Ghi chu cho AI thuc hien

Mau trong anh tham chieu dep vi co phan cap ro: sidebar dam, main panel mem, table row xanh hon, accent cyan dung tiet che. Hay doi mau theo token va audit tung trang, khong chi thay `blue` thanh `cyan` hang loat.
