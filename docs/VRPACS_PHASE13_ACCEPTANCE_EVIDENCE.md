# VRPACS Phase 13 Acceptance Evidence

Updated: 2026-07-13  
Status: **TEMPLATE - NOT IMPLEMENTED / NOT ACCEPTED**

## 1. Release And Clinical Baseline

| Field | Value |
| --- | --- |
| Commit/artifact/migrations | TBD |
| Peer-review policy version | TBD |
| Critical-result policy version | TBD |
| Structured schema versions | TBD |
| Enabled SR/FHIR profiles | TBD |
| Clinical fixture set | TBD |

## 2. Acceptance Traceability

| ID | Criterion | Status | Code/test | Clinical/UAT evidence | Owner |
| --- | --- | --- | --- | --- | --- |
| P13-AC-01 | Reproducible/conflict-aware sampling | Pending | TBD | TBD | Clinical Quality |
| P13-AC-02 | Reviewer confidentiality/scope | Pending | TBD | TBD | Security/Quality |
| P13-AC-03 | CAPA evidence/approval closure | Pending | TBD | TBD | Quality |
| P13-AC-04 | Critical-result fallback/escalation | Pending | TBD | TBD | Clinical Safety |
| P13-AC-05 | Dose source/unit/provenance | Pending | TBD | TBD | Medical Physics |
| P13-AC-06 | Immutable report revision binding | Pending | TBD | TBD | Clinical/Backend |
| P13-AC-07 | Correction/addendum output versioning | Pending | TBD | TBD | Integration |
| P13-AC-08 | SR/FHIR conformance | Pending | TBD | TBD | Integration |
| P13-AC-09 | No autonomous diagnostic mutation | Pending | TBD | TBD | Clinical Safety |
| P13-AC-10 | Pilot/rollback | Pending | TBD | TBD | Release |

## 3. Mandatory Evidence

- [ ] Sampling determinism and conflict exclusions.
- [ ] Report-revision/addendum concurrency tests.
- [ ] Reviewer confidentiality and scoped aggregate negative tests.
- [ ] CAPA lifecycle and unauthorized closure tests.
- [ ] Critical-result timeout/channel failure/downtime drills.
- [ ] Dose parser fixtures, unit conversions and incomplete-source behavior.
- [ ] Structured editor validation and clinician finalization UAT.
- [ ] DICOM SR/FHIR conformance reports for enabled profiles.
- [ ] Outbound duplicate/retry/stale-version tests.
- [ ] Clinical safety hazard review and residual-risk register.
- [ ] Pilot, rollback and reconciliation evidence.

## 4. Deviations And Risks

| ID | Severity | Deviation/risk | Clinical impact | Mitigation/owner | Decision |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | Open |

## 5. Sign-Off

| Role | Decision | Name/date | Conditions |
| --- | --- | --- | --- |
| Clinical Safety | Pending | TBD | |
| Clinical Quality | Pending | TBD | |
| Medical Physics (if dose enabled) | Pending | TBD | |
| Security/Privacy | Pending | TBD | |
| Integration | Pending | TBD | |
| QA/Release | Pending | TBD | |
