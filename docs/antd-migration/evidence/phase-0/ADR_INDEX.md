# Architecture Decision Records (ADR)

1. **ADR 001: Next.js SSR Registry for AntD**
   - Decision: Use `@ant-design/nextjs-registry` to prevent FOUC in App Router.
2. **ADR 002: Adapter-First Migration**
   - Decision: Do not replace `SharedDataGrid` directly. Wrap AntD `Table` in an adapter to preserve existing API.
3. **ADR 003: Tailwind Coexistence**
   - Decision: Retain Tailwind for macro layouts (Workspace, Print) and only remove utility classes iteratively.
4. **ADR 004: Icon Strategy**
   - Decision: Retain `lucide-react` in Phase 1 to reduce blast radius.
5. **ADR 005: Root Vite App Disposition**
   - Decision: Confirmed root Vite app is NOT deployed via `docker-compose.yml`. It is considered legacy. Do NOT migrate it as part of this effort.
6. **ADR 006: OHIF Viewer Boundary**
   - Decision: OHIF will NOT be migrated to AntD. It will only receive CSS token sync for branding.
