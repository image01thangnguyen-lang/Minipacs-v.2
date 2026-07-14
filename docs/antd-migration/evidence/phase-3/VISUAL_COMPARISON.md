# Visual Comparison

## Baseline (Legacy HTML)
- Used native HTML `<input>`, `<select>`, `<button>`.
- Form was attached to the right side of the screen, consuming horizontal space.
- The `SharedDataGrid` was cramped due to the side-panel taking 45% of the viewport.
- Spacing was inconsistent (mix of 1rem padding and margin).

## Ant Design Pilot (`useAntd=true`)
- Uses AntD `Modal` to overlay the Create/Edit form, granting the `SharedDataGrid` 100% of horizontal viewport width. This satisfies the "overlay" requirement.
- Implements `size="small"` globally via AntD context, aligning with the `CLINICAL_UI_STANDARD` for density.
- Maintains strict dark-room aesthetics (`#141414` modal backgrounds).
- Input labels are vertically aligned with proper 4px-8px spacing.

## Evidence status

The statements above describe the intended implementation. Matched baseline/pilot screenshots and human dark-room review are still **PENDING**; visual PASS is not claimed by this document.
