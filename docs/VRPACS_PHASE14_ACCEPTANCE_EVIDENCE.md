# VRPACS Phase 14 Acceptance Evidence

Updated: 2026-07-13  
Status: **TEMPLATE - NOT IMPLEMENTED / NOT ACCEPTED**

## 1. Release And Topology

| Field | Value |
| --- | --- |
| Commit/artifact/migrations | TBD |
| Enabled integration profiles | TBD |
| Identity provider/profile | TBD |
| Sites/facilities in scope | TBD |
| HA topology version | TBD |
| Signed RPO/RTO | TBD |
| Backup/restore set | TBD |

## 2. Acceptance Traceability

| ID | Criterion | Status | Automated/conformance evidence | Drill/manual evidence | Owner |
| --- | --- | --- | --- | --- | --- |
| P14-AC-01 | Message idempotency/correlation | Pending | TBD | TBD | Integration |
| P14-AC-02 | Mapping version/rollback | Pending | TBD | TBD | Integration |
| P14-AC-03 | Organization/facility isolation | Pending | TBD | TBD | Security |
| P14-AC-04 | Federation/privileged access | Pending | TBD | TBD | IAM/Security |
| P14-AC-05 | Backup integrity/isolated restore | Pending | TBD | TBD | DBA/SRE |
| P14-AC-06 | RPO/RTO disaster recovery | Pending | TBD | TBD | SRE/Business |
| P14-AC-07 | Failover/failback reconciliation | Pending | TBD | TBD | SRE/Integration |
| P14-AC-08 | Capacity qualification | Pending | TBD | TBD | SRE/Product |

## 3. Mandatory Evidence

- [ ] Adapter contract and enabled-profile conformance results.
- [ ] Duplicate, malformed, out-of-order, timeout, outage and replay tests.
- [ ] Dead-letter inspection/replay authorization tests.
- [ ] Full sensitive-path cross-facility negative matrix.
- [ ] Federation mapping, revocation, MFA and break-glass review.
- [ ] Secret rotation and service-account lifecycle drill.
- [ ] Backup manifest/checksum and isolated restoration.
- [ ] Failover/failback timeline and data/message/object reconciliation.
- [ ] Signed observed RPO/RTO.
- [ ] Load/soak/capacity/headroom report.
- [ ] Incident communications and runbook usability review.

## 4. DR Reconciliation

| Entity | Before | Recovered | Difference | Explanation/resolution |
| --- | --- | --- | --- | --- |
| Studies/orders/reports | TBD | TBD | TBD | TBD |
| DICOM/non-DICOM objects | TBD | TBD | TBD | TBD |
| Integration messages | TBD | TBD | TBD | TBD |
| Quality/critical events | TBD | TBD | TBD | TBD |
| Audit records | TBD | TBD | TBD | TBD |

## 5. Sign-Off

| Role | Decision | Name/date | Conditions |
| --- | --- | --- | --- |
| Integration Owner | Pending | TBD | |
| Security/IAM/Privacy | Pending | TBD | |
| DBA/SRE | Pending | TBD | |
| Clinical Operations | Pending | TBD | |
| Business Continuity | Pending | TBD | |
| QA/Release | Pending | TBD | |
