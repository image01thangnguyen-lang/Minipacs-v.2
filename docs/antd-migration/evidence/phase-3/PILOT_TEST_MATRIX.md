# Pilot Test Matrix

| Fixture | Component | Result | Note |
|---|---|---|---|
| Empty State | DataGrid | PENDING | Requires browser/UAT execution and captured evidence |
| Populated | DataGrid | PENDING | Requires fixture-backed browser/UAT execution |
| Add Item | Modal Form | PARTIAL | Source-level characterization covers payload keys; end-to-end persistence remains pending |
| Edit Item | Modal Form | PARTIAL | Source-level characterization covers action contract; browser population/persistence remains pending |
| Permission Denied | Actions | PARTIAL | Guards are present in Server Actions; authenticated negative-path integration remains pending |
| Hard Refresh | Page | PENDING | Requires browser capture with the server flag both ON and OFF |

`PASS` is intentionally not assigned without executable output or human/browser evidence.
