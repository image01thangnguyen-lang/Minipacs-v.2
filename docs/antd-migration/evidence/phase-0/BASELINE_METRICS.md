# Baseline Metrics

> **BLOCKED**: Automated capture of visual UI timing (LCP, INP, exact memory usage during render) is blocked because the agent environment lacks a real headless browser hooked up to a patient display for precise rendering telemetry.
> **How to reproduce**: Developers must run Lighthouse and Chrome DevTools Performance tab locally on `/worklist` and `/report/:id` using fixture data.

| Metric | Worklist | Doctor Workspace | Status |
|---|---|---|---|
| Bundle size (JS chunk) | ~153 kB | ~271 kB | Recorded |
| First Contentful Paint | TBD | TBD | BLOCKED |
| Interaction to Next Paint| TBD | TBD | BLOCKED |
| Render rows count | 50-100 | N/A | Recorded |
