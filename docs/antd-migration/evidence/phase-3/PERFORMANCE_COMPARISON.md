# Performance Comparison

- **Bundle Size**: PENDING measurement. No bundle-analyzer artifact is attached, so no numeric increase is asserted.
- **Time To Interactive (TTI)**: PENDING browser measurement for matched legacy/pilot fixtures.
- **Loading behavior**: Both implementations are statically imported by the server route and selected at render time; this is a rollback control, not proof that the legacy client bundle excludes pilot code.
- **FOUC/render blocking**: PENDING browser capture. Phase 1 SSR styling reduces risk but does not replace route-level evidence.
