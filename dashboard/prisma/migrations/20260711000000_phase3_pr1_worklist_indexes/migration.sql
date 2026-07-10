-- Phase 3 PR1 additive indexes. No existing index or data is removed.
CREATE INDEX "worklist_orders_createdAt_id_idx"
  ON "worklist_orders"("createdAt", "id");
CREATE INDEX "worklist_orders_priority_createdAt_id_idx"
  ON "worklist_orders"("priority", "createdAt", "id");
CREATE INDEX "worklist_orders_status_createdAt_id_idx"
  ON "worklist_orders"("status", "createdAt", "id");
CREATE INDEX "worklist_orders_patientName_id_idx"
  ON "worklist_orders"("patientName", "id");

CREATE INDEX "imaging_studies_createdAt_id_idx"
  ON "imaging_studies"("createdAt", "id");
CREATE INDEX "imaging_studies_scheduledAt_id_idx"
  ON "imaging_studies"("scheduledAt", "id");
CREATE INDEX "imaging_studies_priority_createdAt_id_idx"
  ON "imaging_studies"("priority", "createdAt", "id");
CREATE INDEX "imaging_studies_status_createdAt_id_idx"
  ON "imaging_studies"("status", "createdAt", "id");
CREATE INDEX "imaging_studies_patientName_id_idx"
  ON "imaging_studies"("patientName", "id");