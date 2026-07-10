# Phase 3 — Kế hoạch chi tiết Worklist Query, Bộ lọc và Data Grid

Ngày lập: 2026-07-11  
Thuộc master plan: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 2 PR10 đạt gate ENFORCE cho các read path liên quan  
Trạng thái: Kế hoạch triển khai; chưa dựng bố cục 7 vùng/report panel

## 1. Mục tiêu

Thay `getStudies()` tải Orthanc toàn bộ, N+1 enrich và lọc client bằng RIS query có scope, validation, pagination, stable sort và facets. Xây vùng 2–5: search/time, status/facility/consultation facets và bảng nhiều cột có preference.

Không làm: related studies, split pane 7 vùng, autosave/report workflow, đổi status model hay palette.

## 2. Contract nguồn sự thật

```ts
type WorklistQuery = {
  q?: string; from: string; to: string; timezone: string;
  statuses?: string[]; facilityUnitIds?: string[]; dicomNodeIds?: string[];
  consultationStatuses?: string[]; priorities?: string[];
  modality?: string[]; assignedDoctorIds?: string[]; hisStatuses?: string[];
  sort: { key: WorklistSortKey; direction: "asc" | "desc" };
  cursor?: string; limit: number;
};
```

Response gồm `rows`, `pageInfo`, `appliedQuery`, `dataFreshness`, và mỗi row có technical IDs tối thiểu, display fields, `allowedActions`. Facet endpoint nhận query bỏ facet đang đếm và trả status/org/consultation counts đã áp cùng `READ_STUDY` scope. Zod giới hạn mảng, page size, date span và sort allowlist; cursor ký/versioned, không tin Prisma field từ client.

## 3. Kiến trúc và điểm chạm

```text
dashboard/lib/worklist/{contract,validation,query-builder,facets,cursor,row-mapper}.ts
dashboard/app/actions/worklist-actions.ts
dashboard/app/components/workspace/{WorkspaceSearchBar,WorkQueueFacets,FacilityScopeTree,StudyDataGrid}.tsx
dashboard/app/components/ui/data-grid/*
dashboard/lib/preferences/workspace-preferences.ts
```

- Query RIS `ImagingStudy`/relations; Orthanc sync chạy nền và chỉ cung cấp freshness/error state.
- `buildAccessibleStudyWhere()` được AND trong DB query trước pagination/count.
- Batch join facility/node/order/latest report/consultation/doctor; không query từng row.
- Search normalize server-side; nếu cần bỏ dấu dùng normalized columns/index migration riêng, không `%term%` vô hạn.
- Stable sort luôn thêm tie-breaker `id`; cursor gắn filter/sort hash.

## 4. UI/state

- URL là nguồn shareable cho filter/sort/page hợp lệ; state tạm như column resize không làm bẩn history.
- Search debounce 300–500 ms, Enter chạy ngay; request cũ bị ignore/abort bằng request key.
- Preset Today/Yesterday/3/7 days và custom range theo timezone bệnh viện, boundary UTC tính server-side.
- Facet tree chỉ chứa node visible; parent selection expand descendant IDs server-side, không gửi metadata bị cấm.
- Grid: sticky header, pinned identity/action columns, horizontal scroll, keyboard row navigation, density compact/comfortable, column chooser/order/width.
- Selection giữ theo study UID khi row còn trong result; nếu không còn thì clear có chủ đích.

Preference payload versioned, allowlist column IDs/width bounds và lưu theo user; reset default không xóa preference module khác. Không dùng localStorage làm nguồn duy nhất cho dữ liệu theo tài khoản.

## 5. PR slices

1. **P3-PR1 Contract/index/baseline:** schema, query budget, explain plans và indexes.
2. **P3-PR2 Scoped list query:** RIS rows, stable cursor, row mapper, no Orthanc fan-out.
3. **P3-PR3 Facets:** status/org/consultation counts, anti-leak contract tests.
4. **P3-PR4 URL filter store:** parser/serializer/timezone/debounce/cancellation.
5. **P3-PR5 DataGrid foundation:** pinned/sticky/keyboard/loading/error.
6. **P3-PR6 Preferences/actions:** columns/density/allowedActions and responsive behavior.
7. **P3-PR7 migration/cutover:** feature flag old/new list, performance/UAT, remove old fetch only after soak.

## 6. Security, performance và tests

- Cross-hospital row/count/facet leakage tests; forged facility/sort/cursor ignored/rejected.
- Search/date/status intersections and facet self-exclusion semantics.
- Cursor no duplicate/skip under equal dates; document snapshot behavior under concurrent inserts.
- Query count constant with rows; P95 target list <1 s after warm metadata, initial useful <2 s in UAT.
- Empty/error/stale sync/timeout/retry states không fallback sang unscoped Orthanc data.
- Accessibility: table semantics/aria sort, focus visible, badges có text, 1280–2560 px.

## 7. Definition of Done

- [ ] Không còn tải toàn Orthanc hoặc N+1 per-study khi đổi filter.
- [ ] List/facet dùng cùng scoped predicate và count khớp rows.
- [ ] URL round-trip, timezone, stable cursor và request cancellation có test.
- [ ] Grid/preferences phục hồi đúng user và không mass-assign field lạ.
- [ ] Feature flag rollback về UI cũ không đổi schema/data.
- [ ] Typecheck/test/Prisma/build/diff-check và query-plan evidence pass.
## Chỉ mục kế hoạch PR chi tiết

1. [Contract, Index và Baseline](./DOCTOR_WORKSPACE_PHASE3_PR1_WORKLIST_CONTRACT_INDEX_BASELINE_PLAN.md)
2. [Scoped Worklist Query](./DOCTOR_WORKSPACE_PHASE3_PR2_SCOPED_WORKLIST_QUERY_PLAN.md)
3. [Scoped Worklist Facets](./DOCTOR_WORKSPACE_PHASE3_PR3_SCOPED_WORKLIST_FACETS_PLAN.md)
4. [URL Filter State, Timezone và Request Cancellation](./DOCTOR_WORKSPACE_PHASE3_PR4_URL_FILTER_STATE_PLAN.md)
5. [Study Data Grid Foundation](./DOCTOR_WORKSPACE_PHASE3_PR5_STUDY_DATA_GRID_FOUNDATION_PLAN.md)
6. [Column Preferences, Density và Allowed Actions](./DOCTOR_WORKSPACE_PHASE3_PR6_COLUMN_PREFERENCES_ALLOWED_ACTIONS_PLAN.md)
7. [Worklist Feature Flag, UAT và Cutover](./DOCTOR_WORKSPACE_PHASE3_PR7_WORKLIST_CUTOVER_PLAN.md)
