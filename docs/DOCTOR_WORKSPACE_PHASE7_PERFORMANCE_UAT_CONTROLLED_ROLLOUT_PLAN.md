# Phase 7 — Kế hoạch chi tiết Hiệu năng, UAT và Phát hành kiểm soát

Ngày lập: 2026-07-11  
Thuộc master plan: [DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md](./DOCTOR_WORKSPACE_REORGANIZATION_MASTER_PLAN.md)  
Phụ thuộc: Phase 2 enforcement và Phase 3–6 feature-complete

## 1. Mục tiêu và release evidence

Chứng minh workspace an toàn, đủ nhanh và vận hành được trên hạ tầng thật; rollout theo nhóm/bệnh viện với feature flags, observability, support và rollback không mất draft/preference.

Evidence package gồm test report, query plans/load results, security/a11y report, UAT signatures, known issues, migration/backup evidence, dashboards/alerts, runbooks, training và quyết định GO/NO-GO.

## 2. Quality gates

### Functional/clinical

Luồng tìm–lọc–chọn–related–viewer–draft–sign/approve–HIS–consult; status transitions; timezone; refresh/back-forward; concurrent edit; partial outage. Dùng synthetic/de-identified fixtures, không copy PHI production tùy tiện.

### Security/privacy

Matrix role × facility × specialty × machine × capability; row/count/facet/related/report/action isolation; direct API tampering; session expiry; CSRF/auth boundaries; audit/log scrubbing; dependency/secrets/config review. Zero known cross-scope leak là stop-ship.

### Performance/reliability

- First useful worklist P95 <2 s; filter/page P95 <1 s; basic selection P95 <1 s trên UAT mục tiêu.
- Đo P50/P95/P99, error rate, DB pool, slow query, query count, payload/bundle/render, autosave success/conflict.
- Test realistic cardinality/concurrency, latency, packet loss, Orthanc/HIS/DB degradation và recovery; không chỉ benchmark localhost.

### Accessibility/compatibility

Keyboard-only, focus order/trap, screen reader smoke, contrast/non-color status, zoom; viewport 1280/1440/1920/2560 và browser được hỗ trợ.

## 3. Feature flags và rollout rings

Flags server-evaluated theo user/role/facility: new query, seven-region shell, report panel và shared-list adoption có dependency rules; không cho client tự bật. Telemetry phân tách cohort/version.

```text
dev/internal → QA → clinical super-users → pilot hospital → 10% → 25% → 50% → 100%
```

Mỗi ring có minimum soak, sample size, owner, support coverage, threshold latency/error/autosave/permission deny, feedback triage và GO/HOLD/ROLLBACK. Không tăng cohort khi incident Sev1/2 mở hoặc metric thiếu.

## 4. Rollback/DR

- Tắt từng flag không cần rollback DB; schema additive/backward-compatible trong rollout window.
- Draft revision và preference version phải đọc được bởi old/new UI hoặc có safe fallback.
- Rehearse rollback app + mode + migration; xác minh backup/restore và RPO/RTO liên quan.
- Không rollback bằng xóa grant/report/audit. Incident snapshot scrubbed và RCA bắt buộc.

## 5. Vận hành và đào tạo

Dashboard/alert: worklist latency/error, DB/connection, scope deny/mismatch, unclassified, autosave failure/conflict, report action/HIS failure, client error. Runbook có symptom → query/dashboard → mitigation → escalation. Đào tạo theo vai trò bằng tiếng Việt, quick guide menu/filter/layout/draft/conflict và kênh phản hồi trong pilot.

## 6. PR/release slices

1. **P7-PR1 Observability/SLO dashboards và scrub validation.**
2. **P7-PR2 Load/chaos/query optimization có baseline evidence.**
3. **P7-PR3 Security/accessibility/regression automation.**
4. **P7-PR4 UAT fixtures/scripts/sign-off portal hoặc evidence workflow.**
5. **P7-PR5 Feature flags/cohort/rollback tooling.**
6. **P7-PR6 Pilot, feedback fixes và release candidate.**
7. **P7-PR7 Progressive rollout, soak và final handoff.**

## 7. Final acceptance

- [ ] Zero cross-scope leak và không có critical/high unresolved theo risk policy.
- [ ] SLO mục tiêu đạt trên dataset/network/concurrency đã ghi rõ.
- [ ] Autosave/conflict/rollback drills không mất draft; preference fallback đúng.
- [ ] Clinical, security, DBA, operations, product owners ký UAT/GO.
- [ ] Alerts/runbooks/on-call/training/support sẵn sàng trước pilot.
- [ ] Progressive rollout qua đủ rings/soak; known issues có severity/owner/deadline.
- [ ] Release handoff ghi version, flags, schema compatibility, rollback deadline và post-release review.
## Chỉ mục kế hoạch PR chi tiết

1. [Observability, SLO và Log Scrubbing](./DOCTOR_WORKSPACE_PHASE7_PR1_OBSERVABILITY_SLO_PLAN.md)
2. [Load, Chaos và Query Optimization](./DOCTOR_WORKSPACE_PHASE7_PR2_LOAD_CHAOS_OPTIMIZATION_PLAN.md)
3. [Security và Accessibility Regression Automation](./DOCTOR_WORKSPACE_PHASE7_PR3_SECURITY_ACCESSIBILITY_AUTOMATION_PLAN.md)
4. [UAT Fixtures, Scripts và Sign-off](./DOCTOR_WORKSPACE_PHASE7_PR4_UAT_FIXTURES_SIGNOFF_PLAN.md)
5. [Feature Flags, Cohort và Rollback Tooling](./DOCTOR_WORKSPACE_PHASE7_PR5_FEATURE_FLAGS_COHORT_ROLLBACK_PLAN.md)
6. [Pilot và Release Candidate](./DOCTOR_WORKSPACE_PHASE7_PR6_PILOT_RELEASE_CANDIDATE_PLAN.md)
7. [Progressive Rollout và Final Handoff](./DOCTOR_WORKSPACE_PHASE7_PR7_PROGRESSIVE_ROLLOUT_HANDOFF_PLAN.md)
