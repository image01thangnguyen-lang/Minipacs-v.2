# VRPACS Phase 11 Remainder To Final Completion Master Plan

Updated: 2026-07-13  
Status: planning baseline after interrupted Phase 11 implementation  
Scope: resume Phase 11 safely, then complete the remaining product maturity phases through final program closure

## 1. Purpose

This document is the execution plan for the work left after coding stopped part-way through:

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md`

It does not assume that Phase 11 is complete merely because schema or partial UI exists. It separates verified current capability, Phase 11 recovery work, and all subsequent phases. It is the controlling plan for sequencing, PR boundaries, quality gates, rollout, rollback, evidence, and final closure.

The program finishes at Phase 15. Any AI/ML diagnostic product, regulatory medical-device claim, billing/ERP replacement, or unsupported native hardware integration remains a separately approved program rather than silently extending this roadmap.

## 2. Inputs And Planning Rules

### 2.1 Source documents

- `docs/VRPACS_GAP_ANALYSIS_ROADMAP.md`
- `docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md`
- `docs/VRPACS_PHASE10_RELEASE_UAT_GO_LIVE_OPERATIONS_PLAN.md`
- `docs/VRPACS_WORKFLOW_STATUS_POLICY.md`
- `docs/VRPACS_PERMISSION_ACTION_MATRIX.md`
- `docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md`
- `docs/VRPACS_ACCEPTANCE_TEST_SCENARIOS.md`
- `docs/IMAGING_COMMAND_CENTER_STATISTICS_PLAN.md`
- `docs/DOCTOR_WORKSPACE_FINAL_ACCEPTANCE_REPORT.md`
- Current Prisma schema, migrations, dashboard routes, services, tests, and release controls.

### 2.2 Non-negotiable rules

1. Existing user changes must not be reverted to make a phase easier.
2. Database migrations are forward-only, rehearsed on a production-like copy, and have an operational rollback or compatibility strategy.
3. Every mutation has authentication, server-side authorization, scoped object access, validation, audit, idempotency where retryable, and safe error handling.
4. The UI must not offer an action that the backend will reject.
5. PHI is minimized in logs, metrics, filenames, notifications, exports, snapshots, and aggregate dashboards.
6. Missing clinical timestamps or source data are shown as `missing`, `estimated`, or `not measurable`; they are never silently converted into valid KPI values.
7. Peer review, quality rules, or future decision support must not automatically rewrite a final report.
8. Long-running work uses durable jobs with lease/fencing, retries, dead-letter handling, progress, cancellation, and audit.
9. Each phase is feature-flagged where behavior or operational load is risky. Rollback must be exercised, not merely documented.
10. A phase is complete only after code, automated tests, migration evidence, manual QA, security/access checks, observability, runbook, UAT sign-off, and traceability evidence all pass.

## 3. Verified Starting Point And Phase 11 Gap

The repository snapshot shows a real but incomplete Phase 11 foundation.

### 3.1 Present now

- Migration `20260706000000_phase11_pr1_foundation` adds scheduler leases, worker runs, alert rules/events, SLA policies, control-threshold policies, and an expanded critical-result model.
- Prisma includes `SlaPolicy`, `ControlThresholdPolicy`, `AlertRule`, `AlertEvent`, and `CriticalResult` relationships.
- `dashboard/lib/commandCenterService.ts` implements scoped summary, live queue, doctor/machine backlog, open alerts, SLA breach calculation, stuck workflow, PHI masking, and missing-timestamp alert synchronization.
- `/command-center` has queue, SLA, stuck workflow, workload, and alert tabs with polling and pagination.
- A deterministic SLA resolver and unit tests exist.
- Statistics already exposes some operational/quality aggregates and a basic critical-result action path.

### 3.2 Not proven complete

- No dedicated `/quality` module was found.
- No admin UI was found for `/admin/sla-policies` or `/admin/control-thresholds`.
- No complete Alert Rule CRUD/evaluator/acknowledge/resolve UI was found.
- Peer-review/discrepancy and first-class QC issue/re-scan workflows were not found as Phase 11 surfaces.
- A persisted Data Quality Center with scan, deduplication, resolve, suppress, and incident linkage was not found.
- TAT percentile analytics, honest data-completeness panels, and utilization measurement are not complete as specified.
- Current stuck-workflow evaluation fetches active rows and evaluates in memory; this requires scale correction before production expansion.
- The Phase 11 acceptance report, migration rehearsal evidence, load evidence, and full UAT sign-off are absent.

### 3.3 Planning conclusion

Phase 11 is classified **IN PROGRESS / NOT ACCEPTED**. Work must resume at a short reconciliation PR, preserve the usable foundation, and then finish PR 11.2 through PR 11.10 based on evidence rather than restarting the phase.

## 4. End-State Definition

At program closure, MiniPACS must provide:

- Safe, scoped daily RIS/PACS and reporting workflows.
- Production-grade DICOM/DICOMweb and configurable HIS interoperability.
- Quality and safety workflows that are visible, auditable, measurable, and operationally owned.
- Reliable analytics with metric definitions, lineage, completeness, retention, and reproducibility.
- Multi-site operations with tenant/facility isolation, high availability, tested disaster recovery, and capacity governance.
- Structured clinical outputs and standards-based export without changing finalized clinical content implicitly.
- Security/privacy/compliance evidence, accessibility, performance budgets, runbooks, and sustainable release governance.
- A signed final traceability matrix from original VRPACS gaps to implementation, test, evidence, owner, and residual risk.

## 5. Phase Sequence And Dependencies

| Phase | Name | Primary outcome | Hard dependency |
| --- | --- | --- | --- |
| 11R | Resume And Complete Quality/Analytics Governance | Finish interrupted Phase 11 and establish trusted operational controls | Existing Phase 11 foundation |
| 12 | Data Platform, Metric Integrity, And Automation | Move heavy analytics/evaluation to durable, reproducible jobs and snapshots | Phase 11 accepted |
| 13 | Clinical Governance Maturity And Structured Reporting | Mature peer review, critical-result safety, dose/QC, structured output | Phases 11-12 |
| 14 | Enterprise Interoperability, Multi-Site HA/DR | Standards integration, multi-site isolation, resilience, recovery | Phases 12-13 contracts stable |
| 15 | Compliance, Final Validation, And Program Closure | Full-system validation, controlled rollout, handoff, residual-risk acceptance | Phases 11-14 accepted |

Phase 12 design may begin while Phase 11 UAT runs, but no Phase 12 production cutover may conceal or bypass an unaccepted Phase 11 metric. Phase 13 and Phase 14 may overlap only after their shared event, identity, facility, report-version, and audit contracts are frozen.

## 6. Phase 11R - Resume And Complete Phase 11

### 6.1 Goal

Finish the original Phase 11 contract without discarding working code, close authorization/performance/data-integrity gaps, and produce formal acceptance evidence.

### 6.2 PR 11R.0 - Reconciliation And Safety Baseline

Scope:

- Create a requirement-to-code matrix for every Phase 11 acceptance criterion.
- Inventory schema, migrations, routes, actions, services, permissions, navigation, jobs, tests, and seed data.
- Mark each requirement `verified`, `partial`, `missing`, or `superseded`, with file/test evidence.
- Validate migration against empty DB and anonymized production-like DB; report unmappable critical-result rows.
- Freeze canonical enums/contracts for SLA stage, alert status/severity, critical-result status, peer-review status, QC status, and data-quality lifecycle.
- Add feature flags for Command Center write side effects, quality workflows, evaluator workers, and admin policy editors.
- Capture query plans and baseline latency for queue, alerts, SLA, stuck workflow, and statistics.

Done when:

- There is no ambiguous Phase 11 requirement.
- Migration rehearsal, rollback/compatibility notes, baseline performance, and security review are recorded.
- Existing useful behavior has regression tests before further refactoring.

### 6.3 PR 11R.1 - Command Center Completion And Scale Safety

Scope:

- Keep current queue/SLA/stuck/workload/alerts UI and complete facility, machine, doctor, priority, modality, and date filters.
- Make every KPI and aggregate row drill down to a scoped case/job/log view.
- Preserve tab, filters, sort, pagination, and selection during polling; expose last refresh, stale state, pause/resume, and refresh failure.
- Replace unbounded in-memory stuck/SLA scans with indexed candidates, durable evaluation snapshots, or bounded cursor batches.
- Ensure read APIs do not create/resolve alerts as hidden side effects; move reconciliation to a worker.
- Add empty/error/loading/partial-data states, keyboard navigation, screen-reader labels, and responsive behavior.
- Add scoped aggregate tests and PHI masking tests for all entity types.

Done when:

- Coordinator workflows pass SCN-11.1 and SCN-11.2 at production-like volume.
- P95 response and refresh load stay inside agreed budgets.
- Repeated reads are side-effect free.

### 6.4 PR 11R.2 - SLA/TAT And Control Threshold Administration

Scope:

- Build `/admin/sla-policies` with list/create/edit/activate/deactivate/effective dates, deterministic precedence explanation, impact preview, conflict detection, and before/after audit.
- Build `/admin/control-thresholds` for all groups named in Phase 11: workflow, HIS, PACS/DICOM, storage/backup, export/download, share/consultation, quality/safety, data quality, performance/ops, and security/audit.
- Validate operators, units, warning/critical direction, scope, windows, cooldown, owner, escalation, and playbook link.
- Seed versioned defaults idempotently; never overwrite a locally edited policy.
- Add metric registry so a threshold can only reference a known measurable metric with compatible unit and scope.
- Add preview cardinality caps and PHI-safe sample results.

Done when:

- SCN-11.3b and SCN-11.3c pass.
- Preview and runtime resolver produce the same policy decision for the same input.
- Unauthorized direct actions and out-of-scope previews are rejected and audited.

### 6.5 PR 11R.3 - TAT, Workload, Throughput, And Utilization Analytics

Scope:

- Implement stage timestamp extraction for order-to-check-in, check-in-to-scan, scan-to-received, received-to-first-read, first-read-to-final, final-to-delivered, and end-to-end.
- Compute count, average, P50, P90, P95, breach count/rate, missing start/end count, and estimated count.
- Add doctor workload, assignment backlog, throughput, modality/machine/facility throughput, and utilization.
- Label utilization `estimated` until reliable scheduled and scan intervals exist.
- Use one shared filter contract and timezone policy across Command Center, Statistics, export, and drilldown.
- Add aggregate-only CSV/XLSX export with permission, row cap, safe filename, and audit.

Done when:

- Aggregate values reconcile against deterministic fixtures and drilldown populations.
- Missing/estimated data never enters a valid percentile denominator without explicit metric-definition permission.

### 6.6 PR 11R.4 - Critical Result Safety Workflow

Scope:

- Add explicit mark-critical action from report/workspace for permitted report states.
- Add recipient, contact channel, message, assigned owner, due time, severity, and non-diagnostic communication note.
- Implement `PENDING_ACK -> ACKNOWLEDGED`, cancellation with reason, escalation, overdue evaluation, and immutable event timeline.
- Add `/quality/critical-results` queue, report/archive badges, scoped filters, deep links, and ownership handoff.
- Prevent duplicate open critical results for the same report/finding unless override permission and reason are supplied.
- Audit actor, time, source report revision, recipient, state change, and escalation without leaking message content into generic logs.

Done when:

- SCN-11.6 passes, escalation is idempotent, and no critical result can disappear from history after acknowledgement/cancellation.

### 6.7 PR 11R.5 - Peer Review And Discrepancy

Scope:

- Add configurable sampling assignment, conflict-of-interest exclusions, reviewer queue, due dates, and manual assignment.
- Persist reviewed report revision so later addenda do not alter what was assessed.
- Add discrepancy categories/severity, comments, learning-only vs clinical follow-up classification, acknowledgement, and closure.
- Show quality status in report/archive without exposing confidential reviewer details to unauthorized users.
- Link major discrepancy to incident/addendum workflow, but never auto-edit or auto-unfinalize a report.
- Add fair-use governance: no simplistic individual ranking without denominator, case mix, scope, completeness, and approved role.

Done when:

- SCN-11.7 passes and every review is traceable to an immutable report revision.

### 6.8 PR 11R.6 - QC Reject And Re-scan

Scope:

- Add QC issue creation from study, viewer, and eligible non-DICOM case.
- Capture category, severity, series/image reference where applicable, machine, technologist, re-scan required, note, owner, and due date.
- Implement open/acknowledged/resolved/cancelled lifecycle with reason and immutable timeline.
- Integrate safe study status transitions; do not erase original images or report history.
- Add `/quality/qc`, modality/facility trend metrics, reason distribution, and drilldown.

Done when:

- SCN-11.8 passes and metrics reconcile exactly to persisted QC lifecycle events.

### 6.9 PR 11R.7 - Data Quality Center

Scope:

- Add persisted issue model with deterministic `issueKey`, entity reference, rule version, severity, first/last seen, occurrence count, status, assignee, resolution/suppression reason, and expiry.
- Implement bounded scans for duplicate accession/order/study identity, missing required demographics/workflow timestamps, machine mapping gaps, report/study mismatch, orphan jobs/files, and invalid status combinations.
- Add `/quality/data-quality` with scan runs, rule results, resolve, suppress-until, reopen, assignment, and incident creation.
- Deduplicate recurrent issues, resolve stale issues safely, and retain history.
- Keep PHI out of generic issue keys and job logs.

Done when:

- SCN-11.9 passes and re-running the same scan does not create duplicate open issues.

### 6.10 PR 11R.8 - Alert Rule Engine And Alert Center

Scope:

- Build admin CRUD for rule, severity, threshold policy reference, scope, window, cooldown, owner, actions, playbook, active dates, and preview.
- Implement leased/fenced evaluator worker with idempotency keys, deduplication, cooldown, retry, failure visibility, and run history.
- Add Alert Center with open/acknowledged/resolved/suppressed history, assignment, deep link, bulk action limits, and audit.
- Resolve or supersede events deterministically when conditions recover or policy versions change.
- Separate PHI-bearing clinical alerts from system alerts and apply object scope before returning counts or rows.

Done when:

- SCN-11.10 passes under concurrent worker execution without duplicate events.

### 6.11 PR 11R.9 - Phase 11 Acceptance And Controlled Rollout

Scope:

- Run schema validation, migration rehearsal, lint, typecheck, unit, integration, authorization, accessibility, build, load, and manual QA.
- Create production-like fixtures for normal, missing timestamp, duplicate, out-of-scope, concurrent, stale policy, and retry cases.
- Add dashboards and alerts for worker lag/failure, query latency, scan age, stale snapshots, rule errors, alert volume, and data completeness.
- Publish operator, admin-policy, quality-owner, privacy, incident, and rollback runbooks.
- Roll out: dark schema -> worker shadow mode -> read-only UI -> admin pilot -> quality pilot -> scoped production -> general availability.
- Produce `docs/VRPACS_PHASE11_COMPLETION_EVIDENCE.md` and update roadmap/backlog/acceptance traceability.

Phase 11 exit gate:

- All 17 original acceptance criteria pass with evidence.
- No critical/high unresolved security or patient-safety defect.
- Metrics and drilldowns reconcile on signed fixtures.
- Rollback and worker-disable drills pass.
- Clinical Quality, Operations, Security/Privacy, Product, and Release owners sign off.

## 7. Phase 12 - Data Platform, Metric Integrity, And Automation

### 7.1 Goal

Turn Phase 11 calculations into a scalable, reproducible operational data platform. This phase improves reliability; it must not create a second inconsistent analytics truth.

### 7.2 Deliverables

- Canonical event dictionary and metric registry with owner, formula, dimensions, unit, source timestamps, exclusions, timezone, freshness, and version.
- Append-only operational event/outbox pipeline for report, workflow, HIS, QC, peer-review, critical-result, export, storage, and security events.
- Durable metric snapshots/materialized aggregates with watermark, source window, metric version, completeness, lineage, and rebuild status.
- Backfill/rebuild jobs with dry-run, checkpoints, bounded windows, cancellation, and no double counting.
- Data freshness and reconciliation center showing source lag, late events, failed partitions, unknown mappings, and snapshot age.
- Retention/partition/index strategy for event, alert, audit, snapshot, and worker-run tables.
- Governed exports and scheduled aggregate reports with recipient authorization rechecked at execution time.
- SLOs and capacity limits for jobs, queue lag, snapshot freshness, API latency, and storage growth.

### 7.3 PR breakdown

#### PR 12.1 - Metric/event contracts

- Define versioned metric, dimension, event-envelope, correlation, causation, actor, facility, entity, and PHI classification contracts.
- Add contract tests and backward-compatibility rules.

#### PR 12.2 - Transactional outbox and consumers

- Write business mutation plus outbox atomically.
- Add idempotent consumers, lease/fencing, retry/dead-letter, replay controls, and dashboards.

#### PR 12.3 - Snapshot and percentile pipeline

- Build snapshot tables/jobs for TAT, queue, throughput, utilization, critical result, peer review, QC, and data quality.
- Compare shadow snapshots against live Phase 11 calculations before cutover.

#### PR 12.4 - Reconciliation and lineage UI

- Add admin Data Operations page for freshness, completeness, job runs, lineage, mismatch, and controlled rebuild.

#### PR 12.5 - Governed scheduled exports

- Add aggregate report definitions, schedules, scoped recipients, expiry, safe delivery, audit, and cancellation.

#### PR 12.6 - Performance, retention, and cutover

- Add partitions/indexes, retention jobs, load/soak evidence, dual-read comparison, feature-flag cutover, and rollback.

### 7.4 Acceptance criteria

1. A metric value is reproducible from its version, source window, and lineage.
2. Duplicate or replayed events do not double count.
3. Late data is incorporated predictably and marks impacted snapshots stale/rebuilt.
4. Shadow and legacy calculations remain within signed tolerance before cutover.
5. Backfill cannot starve clinical transactional traffic.
6. All jobs expose progress, lag, failure, retry, and operator action.
7. Scheduled export authorization and scope are re-evaluated at run time.
8. Retention removes eligible technical data without violating audit/clinical/legal holds.

## 8. Phase 13 - Clinical Governance Maturity And Structured Reporting

### 8.1 Goal

Extend the Phase 11 safety foundation into mature clinical governance and interoperable structured outputs while keeping clinician control over report content.

### 8.2 Deliverables

- Versioned peer-review program configuration: sampling strategy, exclusions, blinded mode, specialty/modality scope, targets, escalation, and governance calendar.
- Quality committee workflow: agenda, case packet, decision, corrective/preventive action (CAPA), owner, due date, evidence, and closure.
- Critical-result policy sets by finding category/service/facility with escalation rosters and downtime fallback.
- Radiation dose and exposure tracking where source DICOM metadata or RDSR is available; values with incomplete source are clearly qualified.
- Structured report templates/sections, coded concepts, measurements, key-image references, and immutable report-revision linkage.
- DICOM SR and/or FHIR DiagnosticReport/Observation export behind conformance-tested adapters and deployment flags.
- Clinical data provenance and amendment/addendum reconciliation across PDF, HIS result, SR, and FHIR outputs.
- No autonomous diagnosis, no autonomous finalization, and no automatic final-report rewrite.

### 8.3 PR breakdown

#### PR 13.1 - Governance program configuration

- Add policy versions, sampling jobs, exclusions, fairness controls, assignment, and monitoring.

#### PR 13.2 - Committee and CAPA workflow

- Add case packet, restricted notes, actions, due dates, evidence, closure, and aggregate tracking.

#### PR 13.3 - Critical result policy maturity

- Add rosters, channels, escalation schedules, acknowledgement SLA, downtime procedure, and drill evidence.

#### PR 13.4 - Dose/QC registry

- Parse supported dose fields/RDSR, preserve units/provenance, configure diagnostic reference levels, detect outliers, and drill down by permitted scope.

#### PR 13.5 - Structured report model and editor bridge

- Add schema/versioned sections, coded values, measurement/key-image references, validation, preview, and clinician-controlled finalization.

#### PR 13.6 - SR/FHIR export adapters

- Generate conformance-tested outputs, track delivery/retry/version, and prevent stale report revision export.

#### PR 13.7 - Clinical safety validation

- Run specialty fixtures, amendment/addendum tests, provenance checks, downtime drills, and clinical UAT.

### 8.4 Acceptance criteria

1. Peer-review sampling is reproducible, conflict-aware, and auditable.
2. CAPA cannot close without owner, evidence, and authorized approval.
3. Critical-result escalation works during primary-channel and integration failure drills.
4. Dose values preserve source, unit, conversion, completeness, and parser version.
5. Structured outputs reference the exact finalized report revision.
6. Addendum/correction creates a new output version and never silently mutates a delivered artifact.
7. Conformance fixtures pass for each enabled SR/FHIR integration profile.
8. Clinical users retain explicit control of all diagnostic/final content.

## 9. Phase 14 - Enterprise Interoperability, Multi-Site HA/DR

### 9.1 Goal

Make the platform safe and operable across facilities and integration partners, with tested high availability and disaster recovery.

### 9.2 Deliverables

- Versioned integration gateway for REST/HL7 v2/FHIR/DICOMweb adapters with mapping, validation, idempotency, correlation, retry, dead-letter, replay, and PHI-safe observability.
- Capability/conformance profiles per deployment; unsupported standards are not advertised.
- Enterprise identity options (OIDC/SAML where required), session policy, MFA for privileged operations, service accounts, key rotation, and break-glass governance.
- Strong facility/organization partition enforcement for study, report, order, quality, analytics, alert, export, share, and admin paths.
- Multi-site routing/failover policy for Orthanc/DICOM nodes, storage, HIS endpoints, and workers.
- HA topology, backup verification, point-in-time recovery where supported, immutable/off-site copy policy, and restoration automation.
- Defined RPO/RTO by service tier and exercised DR, regional isolation, queue replay, and reconciliation drills.
- Capacity planning for database, object storage, DICOM ingress, exports, viewer concurrency, analytics, and audit growth.

### 9.3 PR breakdown

#### PR 14.1 - Integration contract registry and gateway

- Add endpoint profiles, schema/map versions, validation, secret references, test connection, health, and deployment-scoped activation.

#### PR 14.2 - Durable inbound/outbound messaging

- Add inbox/outbox idempotency, ordering policy, retries, dead-letter UI, controlled replay, and reconciliation.

#### PR 14.3 - Enterprise identity and privileged access

- Add federation adapter, role/group mapping preview, MFA/break-glass/service-account controls, and complete audit.

#### PR 14.4 - Multi-site isolation and routing

- Enforce organization/facility boundaries in shared authorization builders and test every sensitive read/mutation/export path.

#### PR 14.5 - HA, backup, and restore automation

- Add health-aware workers/endpoints, backup manifests/checksums, restore tooling, failover and failback runbooks.

#### PR 14.6 - DR and capacity qualification

- Execute failure injection, restore from backup, replay, data reconciliation, performance/soak, and capacity tests.

### 9.4 Acceptance criteria

1. Duplicate integration messages are idempotent and traceable end-to-end.
2. Mapping changes are versioned, previewed, audited, and rollback-capable.
3. No cross-facility data leakage occurs across the complete sensitive-path inventory.
4. Privileged and break-glass sessions are time-bounded, justified, and reviewed.
5. Backup restoration succeeds on an isolated environment and reconciles clinical/report/object counts and checksums.
6. Signed RPO/RTO targets are met in an observed DR drill.
7. Failback does not lose, duplicate, or reorder clinically material updates outside the documented contract.
8. Capacity headroom and scaling triggers are documented and monitored.

## 10. Phase 15 - Compliance, Final Validation, And Program Closure

### 10.1 Goal

Validate the complete product as an operated system, close the original roadmap with evidence, and transfer sustainable ownership.

### 10.2 Deliverables

- Final requirement traceability matrix: original gap -> phase/PR -> code/migration/config -> automated test -> manual scenario -> evidence -> owner -> residual risk.
- Threat model, privacy impact review, access-control review, dependency/container/SBOM scan, secrets review, penetration-test remediation, and audit-retention review.
- Clinical safety case covering critical results, report revisions, peer review, QC, dose, structured output, downtime, and integration failure.
- Full regression suite across DICOM, HIS, reporting, viewer, non-DICOM, consultation, sharing, export, retention, quality, analytics, multi-site, HA/DR, and native companion if enabled.
- Accessibility and browser/device validation for supported matrix.
- Production-like load, soak, chaos, backup/restore, failover/failback, and downtime exercises.
- Training and competency package by role, admin configuration guide, on-call guide, support escalation, incident templates, and known limitations.
- Controlled release candidate, pilot, progressive rollout, rollback rehearsal, hypercare, KPI monitoring, and final handoff.
- Archived evidence pack, versioned conformance statement, release notes, data migration record, configuration baseline, and accepted residual-risk register.

### 10.3 PR/release breakdown

#### PR 15.1 - Traceability and test inventory freeze

- Freeze release scope and supported matrix; no feature addition after this gate without change control.

#### PR 15.2 - Security/privacy/compliance remediation

- Fix findings, rerun tests, document exceptions with owner/expiry, and generate SBOM/provenance.

#### PR 15.3 - End-to-end qualification automation

- Consolidate deterministic fixtures, smoke/regression scripts, authorization matrix tests, and evidence generation.

#### PR 15.4 - Clinical and operational UAT

- Run role-based scenarios and downtime/failure drills with signed results and defect triage.

#### PR 15.5 - Release candidate and pilot

- Freeze artifacts/config/migrations, deploy to pilot cohort, monitor safety/SLOs, and rehearse rollback.

#### PR 15.6 - Progressive rollout and hypercare

- Expand by facility/cohort only when gates pass; stop/rollback on safety, integrity, security, or SLO breach.

#### PR 15.7 - Final acceptance and handoff

- Close documentation, transfer ownership, archive evidence, accept residual risk, and publish final closure report.

### 10.4 Final acceptance criteria

1. Every in-scope original gap is `accepted`, `accepted with documented limitation`, or `formally deferred` with owner and rationale.
2. No critical/high unresolved patient-safety, data-integrity, privacy, security, or authorization issue remains.
3. Migration, rollback, backup restore, failover/failback, integration replay, and downtime drills pass.
4. P95/P99 latency, error rate, worker lag, freshness, viewer load, and storage capacity meet signed SLOs under agreed load.
5. All supported roles complete UAT and required training.
6. On-call teams can detect, triage, contain, recover, and reconcile representative failures using published runbooks.
7. Release artifacts are immutable, reproducible, scanned, and linked to source/config/migration versions.
8. Product, Clinical Safety, Quality, Security/Privacy, Operations, Integration, and Executive owners sign final acceptance.

## 11. Cross-Phase Architecture Workstreams

### 11.1 Authorization and scope

- Use one server-side authorization vocabulary and one facility/organization scope resolver.
- Cover list, count, aggregate, detail, export, background job, notification, public share, and mutation paths.
- Add negative tests first: unauthorized role, wrong facility, revoked grant, stale session, guessed ID, bulk action, and direct server-action call.

### 11.2 Audit and provenance

- Audit who, what, when, source, reason, entity, report revision, facility, correlation ID, and safe before/after summary.
- Keep clinical payload out of generic logs; store sensitive details only in protected domain records.
- Make audit export separately permissioned, scoped, rate-limited, and recorded.

### 11.3 Jobs and idempotency

- Use stable idempotency keys and lease fencing for evaluators, scans, exports, integrations, snapshots, retention, and notifications.
- Operators can inspect, retry, cancel, or replay only within permission and safety policy.
- Every recovery action generates an audit and reconciliation result.

### 11.4 Data lifecycle

- Define retention and legal/clinical hold for clinical metadata, reports, DICOM/non-DICOM objects, shares, exports, jobs, metrics, alerts, and audit.
- Separate logical lifecycle from physical deletion.
- Verify object/database consistency before and after destructive or restore operations.

### 11.5 Observability and SLO

- Metrics are low-cardinality and PHI-safe.
- Standard signals: request latency/error, DB pool/query latency, job lag/failure/retry, integration queue age, snapshot freshness, alert volume, audit failure, storage free space, backup age, restore status, and viewer failures.
- Every critical alert links to an owner and tested runbook.

### 11.6 UX and accessibility

- Reuse shared filter, data-grid, status badge, dialog, error/empty/loading, and workspace contracts.
- Preserve deep links and URL state where operational handoff requires it.
- Keyboard, focus, contrast, labels, reduced motion, responsive behavior, and destructive confirmation are release gates.

## 12. Standard Definition Of Done For Every PR

Each PR must include:

1. Requirement/acceptance IDs and explicit out-of-scope list.
2. Schema/config/API/UI changes and compatibility impact.
3. Threat and PHI review for changed data paths.
4. Server-side authorization and scoped object-access tests.
5. Unit/integration/regression tests, including failure and concurrency paths.
6. Migration forward test plus rollback/compatibility procedure if data changes.
7. Metrics/logs/alerts and linked runbook for operable behavior.
8. Feature flag, rollout, and rollback plan for risky behavior.
9. Manual QA steps with expected results and evidence location.
10. Updated docs, backlog, traceability, known limitations, and residual risks.
11. Passing lint/typecheck/build and relevant automated suites.
12. Reviewer sign-off from domain owner for clinical, security, integration, or operations changes as applicable.

## 13. Stage Gates And Stop Conditions

### Gate A - Design ready

- Contracts, data ownership, permissions, migration, failure modes, observability, and acceptance fixtures approved.

### Gate B - Merge ready

- PR Definition of Done passes; no unresolved critical/high finding.

### Gate C - Pilot ready

- Production-like migration/load/security/UAT passes; rollback exercised; support trained.

### Gate D - General availability

- Pilot safety and SLO window passes; reconciliation is clean; owners approve expansion.

### Automatic stop/rollback triggers

- Incorrect report revision, recipient, patient/study linkage, or clinical status.
- Cross-scope or PHI exposure.
- Duplicate/lost clinically material message or critical alert.
- Unbounded DB/job load that threatens clinical workflows.
- Migration inconsistency or unreconciled object/database divergence.
- Backup/restore or failover behavior outside approved limits.
- Alerting/observability blind spot for a newly enabled critical path.

## 14. Testing Matrix

| Layer | Required coverage |
| --- | --- |
| Contract | Enum/state transitions, metric formula/version, event schema, API validation |
| Authorization | Role, action, object, facility/org scope, aggregate, export, worker, public link |
| Data | Empty, missing, duplicate, stale, late, conflicting, legacy, timezone/DST, high volume |
| Concurrency | Duplicate request, double click, competing workers, stale revision, lease expiry, retry |
| Integration | Timeout, malformed message, duplicate, out-of-order, partial outage, replay, mapping rollback |
| Clinical safety | Final/addendum revision, critical result escalation, peer-review confidentiality, QC re-scan |
| Resilience | DB/object/integration outage, worker crash, failover, restore, queue replay, reconciliation |
| UX/accessibility | Keyboard, focus, screen reader, contrast, responsive, stale polling, partial data |
| Performance | P50/P95/P99, query plan, memory, queue lag, viewer large study, export, snapshot/backfill |
| Security/privacy | IDOR, CSRF/session, injection, upload, SSRF, secret handling, PHI logs/export/share |

## 15. Rollout Strategy

For each major capability:

1. Deploy additive schema and inert config.
2. Backfill in bounded batches with reconciliation.
3. Run producer/worker in shadow mode.
4. Compare old/new calculations or paths and record tolerance.
5. Enable read-only UI for internal/admin users.
6. Enable mutations for a trained pilot cohort and facility.
7. Observe agreed safety/SLO window.
8. Expand progressively by role/facility.
9. Remove old path only after rollback window closes and evidence is archived.

Rollback order:

- Disable feature flag/new worker.
- Stop new writes while keeping backward-compatible reads.
- Drain or quarantine jobs/messages.
- Revert application artifact/config, not destructive schema.
- Reconcile affected entities/events/artifacts.
- Resume only after incident owner approves.

## 16. Documentation And Evidence Deliverables

Create at minimum:

- `docs/VRPACS_PHASE11_COMPLETION_EVIDENCE.md`
- `docs/VRPACS_PHASE12_DATA_PLATFORM_METRIC_INTEGRITY_PLAN.md`
- `docs/VRPACS_PHASE12_ACCEPTANCE_EVIDENCE.md`
- `docs/VRPACS_PHASE13_CLINICAL_GOVERNANCE_STRUCTURED_REPORTING_PLAN.md`
- `docs/VRPACS_PHASE13_ACCEPTANCE_EVIDENCE.md`
- `docs/VRPACS_PHASE14_ENTERPRISE_INTEROPERABILITY_HA_DR_PLAN.md`
- `docs/VRPACS_PHASE14_ACCEPTANCE_EVIDENCE.md`
- `docs/VRPACS_PHASE15_FINAL_VALIDATION_PROGRAM_CLOSURE_PLAN.md`
- `docs/VRPACS_PHASE15_FINAL_ACCEPTANCE_REPORT.md`
- Updated `VRPACS_GAP_ANALYSIS_ROADMAP.md`, implementation backlog, acceptance scenarios, permission matrix, data/audit map, workflow policy, runbooks, and final traceability matrix.

Evidence for a phase must include commit/artifact references, files changed, migration/config notes, tests and exact commands/results, QA screenshots/logs where appropriate, performance numbers, security/access results, rollout/rollback drill, open risks, owner, and sign-off date.

## 17. Recommended Execution Order From Current Snapshot

1. Execute PR 11R.0 before writing more Phase 11 feature code.
2. Complete Command Center scale safety and policy administration before adding more alert types.
3. Complete persisted quality workflows before relying on their aggregate metrics.
4. Move alert/data-quality evaluation out of read paths and into leased workers.
5. Accept Phase 11 formally.
6. Build Phase 12 event/snapshot contracts in shadow mode and cut over only after reconciliation.
7. Build Phase 13 clinical governance and structured outputs on immutable report revisions.
8. Freeze shared contracts, then execute Phase 14 interoperability and multi-site resilience.
9. Freeze features at Phase 15, validate the whole operated system, roll out progressively, and close the program.

## 18. Program Completion Checklist

- [ ] Phase 11 reconciliation matrix completed.
- [ ] Phase 11 original acceptance criteria passed and signed.
- [ ] Phase 12 metric lineage, event processing, snapshots, reconciliation, and governed exports accepted.
- [ ] Phase 13 clinical governance, dose/QC, structured report, and enabled standards exports accepted.
- [ ] Phase 14 interoperability, isolation, HA, backup/restore, RPO/RTO, and DR accepted.
- [ ] Phase 15 security/privacy/clinical/full regression/UAT qualification accepted.
- [ ] Original gap roadmap fully traced to accepted, limited, or formally deferred outcomes.
- [ ] All operational owners, SLOs, alerts, runbooks, escalation paths, and training are active.
- [ ] Residual risks and unsupported capabilities are explicitly documented and signed.
- [ ] Final release artifact/config/migration/evidence pack is archived and reproducible.

## 19. Handoff Prompt For The Next Coding Agent

```text
You are continuing MiniPACS/VRPACS after an interrupted Phase 11 implementation.

Read first:
- docs/VRPACS_PHASE11_REMAINDER_TO_FINAL_COMPLETION_MASTER_PLAN.md
- docs/VRPACS_PHASE11_QUALITY_ANALYTICS_CLINICAL_GOVERNANCE_PLAN.md
- docs/VRPACS_GAP_ANALYSIS_ROADMAP.md
- docs/VRPACS_PERMISSION_ACTION_MATRIX.md
- docs/VRPACS_DATA_AUDIT_SAFETY_MAP.md
- docs/VRPACS_WORKFLOW_STATUS_POLICY.md

Start only with PR 11R.0 reconciliation. Do not assume Phase 11 is complete and do not restart it blindly.
Inventory current schema, migrations, routes, services, permissions, jobs, tests, and UI against every Phase 11 acceptance criterion.
Preserve user changes. Add regression evidence before refactoring existing Command Center behavior.

Mandatory constraints:
- Server-side authorization and organization/facility/object scope on every path.
- No PHI-heavy logs, metrics, notification, aggregate export, or filenames.
- No silent KPI fallback; mark missing/estimated data.
- No automatic edit/unfinalize of final reports.
- Durable workers require idempotency, lease/fencing, retry, failure visibility, and audit.
- Read APIs must not hide expensive write side effects.
- Migration, tests, build, manual QA, observability, rollout, and rollback evidence are required.

At the end of the PR, report:
- requirement-to-code status matrix;
- files changed;
- schema/config/API/UI behavior changes;
- migration and compatibility notes;
- exact test/build commands and results;
- security, scope, PHI, performance, and concurrency checks;
- manual QA scenarios;
- rollout/rollback steps;
- unresolved risks and the exact next PR.
```