-- AlterTable: PrintTemplate
ALTER TABLE "print_templates" ADD COLUMN "code" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "description" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "modality" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "bodyPart" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "facilityId" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "procedureCatalogId" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "dicomNodeId" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "paperSize" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "orientation" TEXT;
ALTER TABLE "print_templates" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "print_templates" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "print_templates" ADD COLUMN "metadataJson" TEXT;
CREATE INDEX "print_templates_dicomNodeId_idx" ON "print_templates"("dicomNodeId");
CREATE INDEX "print_templates_procedureCatalogId_idx" ON "print_templates"("procedureCatalogId");
CREATE INDEX "print_templates_facilityId_idx" ON "print_templates"("facilityId");

-- AlterTable: ProcedureCatalog
ALTER TABLE "procedure_catalog" ADD COLUMN "serviceTypeId" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "description" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "defaultDurationMinutes" INTEGER;
ALTER TABLE "procedure_catalog" ADD COLUMN "defaultPriority" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "defaultRoom" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "hisCode" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "insuranceCode" TEXT;
ALTER TABLE "procedure_catalog" ADD COLUMN "requiresContrast" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "procedure_catalog" ADD COLUMN "isNonDicomEligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "procedure_catalog" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "procedure_catalog_serviceTypeId_idx" ON "procedure_catalog"("serviceTypeId");

-- AlterTable: DicomNode
ALTER TABLE "dicom_nodes" ADD COLUMN "facilityId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultFolderId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultShareFolderId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultUploadFolderId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultProcedureCatalogId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultPrintTemplateId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "defaultReportTemplateTextId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "serviceTypeId" TEXT;
ALTER TABLE "dicom_nodes" ADD COLUMN "isNonDicom" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dicom_nodes" ADD COLUMN "metadataJson" TEXT;
CREATE INDEX "dicom_nodes_facilityId_idx" ON "dicom_nodes"("facilityId");
CREATE INDEX "dicom_nodes_serviceTypeId_idx" ON "dicom_nodes"("serviceTypeId");

-- CreateTable: ServiceTypeCatalog
CREATE TABLE "service_type_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultModality" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_type_catalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_type_catalog_code_key" ON "service_type_catalog"("code");

-- CreateTable: IcdCatalog
CREATE TABLE "icd_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chapter" TEXT,
    "groupCode" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "icd_catalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "icd_catalog_code_key" ON "icd_catalog"("code");

-- CreateTable: ProcedureIcdMapping
CREATE TABLE "procedure_icd_mapping" (
    "id" TEXT NOT NULL,
    "procedureCatalogId" TEXT NOT NULL,
    "icdCatalogId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "procedure_icd_mapping_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "procedure_icd_mapping_procedureCatalogId_idx" ON "procedure_icd_mapping"("procedureCatalogId");
CREATE INDEX "procedure_icd_mapping_icdCatalogId_idx" ON "procedure_icd_mapping"("icdCatalogId");
CREATE UNIQUE INDEX "procedure_icd_mapping_procedureCatalogId_icdCatalogId_key" ON "procedure_icd_mapping"("procedureCatalogId", "icdCatalogId");

-- CreateTable: ProcedureReportTemplateMapping
CREATE TABLE "procedure_report_template_mapping" (
    "id" TEXT NOT NULL,
    "procedureCatalogId" TEXT,
    "reportTemplateTextId" TEXT NOT NULL,
    "icdCatalogId" TEXT,
    "dicomNodeId" TEXT,
    "facilityId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "procedure_report_template_mapping_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "procedure_report_template_mapping_procedureCatalogId_idx" ON "procedure_report_template_mapping"("procedureCatalogId");
CREATE INDEX "procedure_report_template_mapping_reportTemplateTextId_idx" ON "procedure_report_template_mapping"("reportTemplateTextId");
CREATE INDEX "procedure_report_template_mapping_icdCatalogId_idx" ON "procedure_report_template_mapping"("icdCatalogId");
CREATE INDEX "procedure_report_template_mapping_dicomNodeId_idx" ON "procedure_report_template_mapping"("dicomNodeId");
CREATE INDEX "procedure_report_template_mapping_facilityId_idx" ON "procedure_report_template_mapping"("facilityId");

-- CreateTable: FacilityUnit
CREATE TABLE "facility_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "facility_units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "facility_units_code_key" ON "facility_units"("code");
CREATE INDEX "facility_units_parentId_idx" ON "facility_units"("parentId");

-- CreateTable: StorageFolderConfig
CREATE TABLE "storage_folder_configs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "facilityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckStatus" TEXT,
    "lastCheckMessage" TEXT,
    "lastCheckAt" TIMESTAMP(3),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "storage_folder_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "storage_folder_configs_code_key" ON "storage_folder_configs"("code");
CREATE INDEX "storage_folder_configs_facilityId_idx" ON "storage_folder_configs"("facilityId");

-- CreateTable: MachineProcedureMapping
CREATE TABLE "machine_procedure_mapping" (
    "id" TEXT NOT NULL,
    "dicomNodeId" TEXT NOT NULL,
    "procedureCatalogId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "machine_procedure_mapping_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "machine_procedure_mapping_dicomNodeId_idx" ON "machine_procedure_mapping"("dicomNodeId");
CREATE INDEX "machine_procedure_mapping_procedureCatalogId_idx" ON "machine_procedure_mapping"("procedureCatalogId");
CREATE UNIQUE INDEX "machine_procedure_mapping_dicomNodeId_procedureCatalogId_key" ON "machine_procedure_mapping"("dicomNodeId", "procedureCatalogId");

-- CreateTable: DoctorMachinePermission
CREATE TABLE "doctor_machine_permissions" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dicomNodeId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "allow" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,
    CONSTRAINT "doctor_machine_permissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "doctor_machine_permissions_doctorId_idx" ON "doctor_machine_permissions"("doctorId");
CREATE INDEX "doctor_machine_permissions_dicomNodeId_idx" ON "doctor_machine_permissions"("dicomNodeId");
CREATE UNIQUE INDEX "doctor_machine_permissions_doctorId_dicomNodeId_actionKey_key" ON "doctor_machine_permissions"("doctorId", "dicomNodeId", "actionKey");

-- CreateTable: SupplyCatalog
CREATE TABLE "supply_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "defaultPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supply_catalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "supply_catalog_code_key" ON "supply_catalog"("code");

-- AddForeignKey constraints
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_procedureCatalogId_fkey" FOREIGN KEY ("procedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procedure_catalog" ADD CONSTRAINT "procedure_catalog_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_type_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultProcedureCatalogId_fkey" FOREIGN KEY ("defaultProcedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultPrintTemplateId_fkey" FOREIGN KEY ("defaultPrintTemplateId") REFERENCES "print_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultReportTemplateTextId_fkey" FOREIGN KEY ("defaultReportTemplateTextId") REFERENCES "report_template_texts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_type_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procedure_icd_mapping" ADD CONSTRAINT "procedure_icd_mapping_procedureCatalogId_fkey" FOREIGN KEY ("procedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_icd_mapping" ADD CONSTRAINT "procedure_icd_mapping_icdCatalogId_fkey" FOREIGN KEY ("icdCatalogId") REFERENCES "icd_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procedure_report_template_mapping" ADD CONSTRAINT "procedure_report_template_mapping_procedureCatalogId_fkey" FOREIGN KEY ("procedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_report_template_mapping" ADD CONSTRAINT "procedure_report_template_mapping_reportTemplateTextId_fkey" FOREIGN KEY ("reportTemplateTextId") REFERENCES "report_template_texts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_report_template_mapping" ADD CONSTRAINT "procedure_report_template_mapping_icdCatalogId_fkey" FOREIGN KEY ("icdCatalogId") REFERENCES "icd_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_report_template_mapping" ADD CONSTRAINT "procedure_report_template_mapping_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedure_report_template_mapping" ADD CONSTRAINT "procedure_report_template_mapping_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "facility_units" ADD CONSTRAINT "facility_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "storage_folder_configs" ADD CONSTRAINT "storage_folder_configs_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facility_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "machine_procedure_mapping" ADD CONSTRAINT "machine_procedure_mapping_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "machine_procedure_mapping" ADD CONSTRAINT "machine_procedure_mapping_procedureCatalogId_fkey" FOREIGN KEY ("procedureCatalogId") REFERENCES "procedure_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_machine_permissions" ADD CONSTRAINT "doctor_machine_permissions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_machine_permissions" ADD CONSTRAINT "doctor_machine_permissions_dicomNodeId_fkey" FOREIGN KEY ("dicomNodeId") REFERENCES "dicom_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manually added missing indices and constraints
CREATE UNIQUE INDEX "print_templates_code_key" ON "print_templates"("code");
CREATE INDEX "procedure_catalog_hisCode_idx" ON "procedure_catalog"("hisCode");
CREATE INDEX "procedure_catalog_insuranceCode_idx" ON "procedure_catalog"("insuranceCode");
CREATE INDEX "procedure_catalog_modality_bodyPart_idx" ON "procedure_catalog"("modality", "bodyPart");

CREATE INDEX "dicom_nodes_defaultFolderId_idx" ON "dicom_nodes"("defaultFolderId");
CREATE INDEX "dicom_nodes_defaultShareFolderId_idx" ON "dicom_nodes"("defaultShareFolderId");
CREATE INDEX "dicom_nodes_defaultUploadFolderId_idx" ON "dicom_nodes"("defaultUploadFolderId");

ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultFolderId_fkey" FOREIGN KEY ("defaultFolderId") REFERENCES "storage_folder_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultShareFolderId_fkey" FOREIGN KEY ("defaultShareFolderId") REFERENCES "storage_folder_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dicom_nodes" ADD CONSTRAINT "dicom_nodes_defaultUploadFolderId_fkey" FOREIGN KEY ("defaultUploadFolderId") REFERENCES "storage_folder_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

