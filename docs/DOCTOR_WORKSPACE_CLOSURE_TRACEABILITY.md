# Doctor Workspace — closure traceability

Ngày kiểm kê: 2026-07-12  
Nguồn chuẩn: `DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md`  
Quy ước: chỉ `PASS`, `PARTIAL`, `MISSING`, `EXTERNAL_GATE`. `PASS` dưới đây là implementation có code/test tĩnh hoặc tự động; không thay thế xác nhận UAT/vận hành.

| ID | Phase/PR | Acceptance criterion | Code | Test/evidence | Owner | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0-01 | Phase 0 | Wireframe 7 vùng và breakpoint | `app/components/workspace/DoctorWorkspace.tsx`, `app/globals.css` | Master plan §4/§8; cần ảnh thật | Product/UX | PARTIAL | Chưa có visual capture/approval 1280–2560 |
| P0-02 | Phase 0 | Menu map, route và nhãn Việt | `lib/navigation.ts` | `lib/navigation.test.ts`; master plan §5 | Product | PASS | — |
| P0-03 | Phase 0 | Data dictionary/cột/preset/taxonomy | `lib/worklist/contract.ts`, Prisma schema | Phase 3 plans + contract tests | Lead Developer | PASS | — |
| P0-04 | Phase 0 | Fixture matrix đa cơ sở/quyền | `prisma/uat-phase7-fixtures.json`, `lib/release-control/uat-fixtures.ts` | `PHASE7_PR4_UAT_FIXTURES_SIGNOFF_EVIDENCE.md` | QA | PASS | — |
| P0-05 | Phase 0 | Baseline UX/performance thật | telemetry/SLO instrumentation | `WORKLIST_BASELINE_PR1.md` | Operations | EXTERNAL_GATE | Cần đo/capture trên UAT thật |
| P1-01 | Phase 1 | Registry cây, permission visibility, ẩn nhóm rỗng | `lib/navigation.ts`, navigation components | `lib/navigation.test.ts` | Lead Developer | PASS | — |
| P1-02 | Phase 1 | Active route/deep link, giữ URL | navigation/app shell | `lib/navigation.test.ts` | Lead Developer | PASS | — |
| P1-03 | Phase 1 | Search menu và expand/collapse theo user | navigation/preferences implementation | Phase 1 plan | Lead Developer | PARTIAL | Cần evidence UI/persistence theo tài khoản |
| P1-04 | Phase 1 | Direct route có server authorization | middleware/server actions | security regression | Security | PASS | — |
| P2-01 | Phase 2 | Resolver dùng chung, deny-wins, fail-closed | `lib/authz/scope/*` | scope resolver/filter/security tests | Security | PASS | — |
| P2-02 | Phase 2 | List/facet/detail/related/action không vượt scope | worklist/workspace/related/actions | contract, query, workspace, security tests | Security | PASS | — |
| P2-03 | Phase 2 | Migration/readiness trên bản sao UAT | migration + readiness scripts | `PHASE2_CLOSURE_EVIDENCE.md` template | DBA | EXTERNAL_GATE | Chưa chạy trên UAT copy |
| P2-04 | Phase 2 | SHADOW zero unexplained mismatch | authorization mode/telemetry | cutover runbook | Security | EXTERNAL_GATE | Cần observation window được duyệt |
| P2-05 | Phase 2 | ENFORCE ring + DBA/Security/Hospital signatures | server mode/config | `PHASE2_CLOSURE_EVIDENCE.md` | DBA/Security/Clinical | EXTERNAL_GATE | Chữ ký và cutover thật |
| P3-01 | Phase 3 | Search/date/all-filter intersection | `lib/worklist/*` | contract/query builder/service tests | Lead Developer | PASS | — |
| P3-02 | Phase 3 | URL round-trip, presets, Enter/debounce/clear | URL state + workspace search | `url-state.test.ts` | Lead Developer | PASS | — |
| P3-03 | Phase 3 | Cancellation/stale response protection | workspace selection/request logic | selection/query tests | Lead Developer | PASS | — |
| P3-04 | Phase 3 | Facet parity, no forbidden metadata | facets/scope builder | contract/security tests | Security | PASS | — |
| P3-05 | Phase 3 | Grid pinned/sticky/scroll/preferences/density | `StudyDataGrid.tsx`, shared `DataGrid.tsx`, preferences | shared contracts/preferences tests | Product/UX | PARTIAL | Keyboard + visual regression cần browser evidence |
| P4-01 | Phase 4 | Seven-region composition/responsive | `DoctorWorkspace.tsx`, regions, CSS | Phase 4 tests/plans | Product/UX | PARTIAL | Cần visual evidence tại mọi breakpoint |
| P4-02 | Phase 4 | Persist splitter/collapse/reset layout | SplitPane + workspace preferences | preference tests | Lead Developer | PASS | — |
| P4-03 | Phase 4 | Independent related studies/ranges/fail-closed | related studies action/lib/panel | related range/workspace/security tests | Security | PASS | — |
| P4-04 | Phase 4 | Selection/deep-link/race/focus restoration | workspace selection/composition | selection tests | QA | PARTIAL | Focus restoration cần browser test |
| P5-01 | Phase 5 | Revisioned autosave/conflict/status | autosave/report workspace | autosave/report tests | Lead Developer | PASS | — |
| P5-02 | Phase 5 | Dirty guard internal/unload/panel/case | dirty context/dialog/panel | report panel tests | QA | PASS | — |
| P5-03 | Phase 5 | Read-only UI + direct action denial | report panel + scoped actions | workspace/security tests | Security | PASS | — |
| P5-04 | Phase 5 | Draft/sign/approve/unfinalize/deliver/HIS/consult | workflow/actions/allowed actions | report/security tests | Clinical/Security | PASS | — |
| P5-05 | Phase 5 | Session expiry/concurrent edit/HIS failure | autosave/workflow handling | automated tests + Phase 5 runbook | Clinical | PARTIAL | E2E UAT negative cases chưa ký |
| P6-01 | Phase 6 | Shared UI adoption all listed pages | archive/worklist/consult/non-DICOM/statistics/admin grids | shared contracts test/evidence | Lead Developer | PASS | — |
| P6-02 | Phase 6 | Standard states/density/status/filter/header | shared UI contracts/components | shared contracts test | Product/UX | PASS | — |
| P6-03 | Phase 6 | Remove legacy duplicates/hardcoded new colors | shared components/CSS | Phase 6 inventory | Lead Developer | PARTIAL | Cần visual regression trước khi xóa cuối |
| P7-01 | Phase 7 | Security/accessibility automation | release regression/shared grid | Phase 7 PR3 evidence | Security/QA | PASS | — |
| P7-02 | Phase 7 | UAT fixture validation | fixture validator | Phase 7 PR4 evidence | QA | PASS | — |
| P7-03 | Phase 7 | Feature flags/rollback/release gates | `lib/release-control/*`, config | release-control tests; PR5–PR7 evidence | Release Manager | PASS | — |
| P7-04 | Phase 7 | UAT SLO/query plan/no N+1 | telemetry/load runbook | observability runbook | Operations/DBA | EXTERNAL_GATE | Hạ tầng UAT thật và tải thực tế |
| P7-05 | Phase 7 | Clinical/security/ops/product UAT sign-off | runbook/templates | UAT evidence templates | Named approvers | EXTERNAL_GATE | Không được tự ký |
| P7-06 | Phase 7 | Restore drill RPO/RTO/data preservation | rollback runbooks | evidence template | DBA/Operations | EXTERNAL_GATE | Restore drill thật |
| P7-07 | Phase 7 | Pilot/rings/soak/100% approval | release-control code | rollout handoff evidence | Release Manager | EXTERNAL_GATE | Pilot, elapsed soak và approvals thật |
| P7-08 | Phase 7 | Post-release review | handoff runbook | rollout evidence | Product/Operations | EXTERNAL_GATE | Chỉ lập lịch sau rollout được duyệt |

## Kết luận kiểm kê

- Không có criterion để trống trạng thái.
- Các mục kỹ thuật chính có implementation/test được đánh dấu `PASS`; các kiểm tra browser/visual chưa chạy là `PARTIAL`.
- Mọi hoạt động đòi UAT thật, hạ tầng, thời gian trôi qua, restore hoặc chữ ký được giữ `EXTERNAL_GATE`.
- Release vẫn **HOLD/PENDING**, không suy diễn readiness 100% từ implementation.