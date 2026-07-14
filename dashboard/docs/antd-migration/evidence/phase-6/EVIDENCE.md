# Phase 6: Clinical Workspace (AntD Migration Evidence)

## 1. Scope & Execution
- **Target**: Doctor Workspace (`WorkspaceAntd.tsx` and 7 sub-regions).
- **Strategy**: Vertical slice migration preserving CSS Grid layout and `react-split` boundaries.
- **Wave 6A (Nav & Filter)**: `WorkspaceSwitcher`, `WorkspaceSearchBar`, `WorkQueueFacets`, `FacilityScopeTree` migrated.
- **Wave 6B (Grid)**: `StudyDataGrid` migrated to `Table` with row selection and status markers.
- **Wave 6C (Context)**: `PatientStudyContextPanel`, `RelatedStudiesPanel` migrated, preserving `ConsultationContext`, `SecondReadContext`, `ViewerArtifactsContext`.
- **Wave 6D (Editor)**: `ReportWorkspacePanel`, `ReportEditorSection`, `ReportActionsBar`, `ReportTemplatePicker` migrated. Tiptap engine preserved.
- **Wave 6E (Safety)**: `UnsavedChangesDialog` migrated to AntD Modal.
- **Wave 6F (Wrap-up)**: Context logic integrated. Build checked.

## 2. Testing Evidence
- **Production build**: `npm --prefix dashboard run build` completed successfully on 2026-07-15 (compile, type-check, 66 static pages, and build traces). The repository still emits pre-existing/non-blocking ESLint warnings; Phase 6 does not claim a warning-free lint baseline.
- **Characterization smoke tests**: `npx --prefix dashboard tsx --test dashboard/tests/workspace-characterization.test.ts` — 2 passed, 0 failed. These cover default workspace preferences and the dirty-navigation guard contract; they are not a substitute for the full clinical UAT matrix.
- **Release-control regression**: `npx --prefix dashboard tsx --test dashboard/lib/release-control/release-control.test.ts` — passed.
- **Layout & Tokens**: Maintained `#1F1F1F` and `#141414` clinical dark tokens. No pure `#FFFFFF` backgrounds used in data-dense regions. Padding and spacing conform to the 2/4/8px rules.
- **Data Preservation**:
  - `StudyDataGrid` retains double-click to view behavior.
  - Race token logic in `PatientStudyContextPanel` is preserved.
  - Autosave context in `ReportWorkspacePanel` is untouched.
- **Rollback path**: The server-side capability `evaluateScopedCapability(..., "useAntdWorkspace")` conditionally selects the AntD or legacy workspace. Automated release-control coverage passed; a timed operator rollback drill and captured UAT evidence remain required before production cutover.

## 3. Deviations & Notes
- Tiptap editor was not rewritten in AntD, but its surrounding layout and `textarea` fields (Conclusion, Recommendation) were updated to `Input.TextArea` from AntD.
- `WorkspaceSwitcher` required type checking (`node.type === 'group'`) for discriminated unions.
- Review remediation hardened feature-flag fallback behavior and the migrated workspace's clinical interaction/accessibility paths while preserving the legacy implementation as the rollback target.
- Visual regression, keyboard-only workflow, screen-reader checks, autosave/conflict recovery, report signing, and real operator rollback are manual acceptance gates and have not been represented as automated passes here.

## 4. Sign-off
- **Phase**: 6
- **Engineering status**: PASS (build and targeted automated checks)
- **Production cutover status**: PENDING CLINICAL UAT / ROLLBACK DRILL
- **Reviewed**: 2026-07-15
