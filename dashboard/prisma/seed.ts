import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const roleProfiles = [
    {
      code: 'ADMIN',
      name: 'Admin',
      description: 'Toàn quyền cấu hình hệ thống, PACS, người dùng và dữ liệu vận hành.',
      baseRole: Role.ADMIN,
      permissions: [
        'studies.read',
        'reports.read',
        'reports.write',
        'reports.finalize',
        'reports.cancelDraft',
        'reports.unfinalize',
        'reports.print',
        'studies.assign',
        'studies.updateClinical',
        'worklist.manage',
        'archive.read',
        'archive.deliver',
        'statistics.read',
        'statistics.doctorStats',
        'users.manage',
        'templates.manage',
        'clinic.manage',
        'pacs.manage',
        'his.read',
        'his.sync',
        'his.retry',
        'his.manage',
        'his.apiLogs',
        'his.apiTest',
        'his.mapping',
        'his.conflictReview',
        'admin.catalogs',
        'admin.facilities',
        'admin.permissions',
        'admin.storage',
        'viewer.configure',
        'viewer.export',
        'viewer.anonymize',
        'viewer.history',
        'viewer.deleteSeries',
        'nonDicom.read',
        'nonDicom.create',
        'nonDicom.capture',
        'nonDicom.edit',
        'nonDicom.deleteMedia',
        'nonDicom.copyMedia',
        'nonDicom.print',
        'nonDicom.video',
        'export.read',
        'export.create',
        'export.anonymize',
        'export.bulk',
        'export.manage',
        'retention.read',
        'retention.manage',
        'retention.execute',
        'backup.read',
        'backup.manage',
        'backup.restoreChecklist',
        'destructive.request',
        'destructive.approve',
        'destructive.execute',
        'destructive.audit',
        'ops.health',
        'ops.health.run',
        'ops.security',
        'ops.security.resolve',
        'ops.performance',
        'ops.dicomConformance',
        'ops.deployment',
        'system.audit',
        'system.audit.export',
        'account.selfManage',
        'native.manage',
        'native.use',
        'release.read',
        'release.manage',
        'release.signoff',
        'uat.read',
        'uat.manage',
        'uat.execute',
        'golive.manage',
        'training.read',
        'training.manage',
        'training.attest',
        'incident.read',
        'incident.manage',
        'incident.report',
        'change.read',
        'change.manage',
        'change.request',
        'change.approve',
        'runbook.read',
        'runbook.manage',
        'runbook.execute',
        'commandCenter.read',
        'quality.read',
        'quality.manage',
        'quality.peerReview',
        'quality.criticalResult',
        'quality.qc',
        'analytics.read',
        'analytics.doctor',
        'analytics.export',
        'alerts.read',
        'alerts.manage',
        'alerts.ack',
        'thresholds.read',
        'thresholds.manage',
        'dataQuality.read',
        'dataQuality.manage'
      ],
      isSystem: true,
      isActive: true
    },
    {
      code: 'DOCTOR',
      name: 'Bác sĩ',
      description: 'Đọc phim, soạn/ký báo cáo, quản lý mẫu cá nhân và xem thống kê chuyên môn.',
      baseRole: Role.DOCTOR,
      permissions: [
        'studies.read',
        'reports.read',
        'reports.write',
        'reports.finalize',
        'reports.cancelDraft',
        'reports.print',
        'studies.updateClinical',
        'archive.read',
        'statistics.read',
        'statistics.doctorStats',
        'templates.manage',
        'his.read',
        'his.sync',
        'his.retry',
        'viewer.configure',
        'viewer.export',
        'viewer.anonymize',
        'viewer.history',
        'nonDicom.read',
        'nonDicom.capture',
        'nonDicom.copyMedia',
        'nonDicom.print',
        'nonDicom.video',
        'export.read',
        'export.create',
        'export.anonymize',
        'destructive.request',
        'release.read',
        'uat.read',
        'uat.execute',
        'training.read',
        'training.attest',
        'incident.read',
        'incident.report',
        'change.read',
        'change.request',
        'account.selfManage',
        'quality.peerReview',
        'quality.criticalResult',
        'analytics.doctor',
        'quality.read',
        'analytics.read',
        'commandCenter.read'
      ],
      isSystem: true,
      isActive: true
    },
    {
      code: 'TECHNICIAN',
      name: 'Kỹ thuật viên',
      description: 'Theo dõi danh sách ca, tiếp nhận/worklist và xử lý vận hành kỹ thuật.',
      baseRole: Role.TECHNICIAN,
      permissions: ['studies.read', 'studies.assign', 'studies.updateClinical', 'worklist.manage', 'archive.read', 'statistics.read', 'his.read', 'his.sync', 'his.retry', 'viewer.configure', 'viewer.history', 'viewer.export', 'viewer.anonymize', 'nonDicom.read', 'nonDicom.create', 'nonDicom.capture', 'nonDicom.edit', 'nonDicom.deleteMedia', 'nonDicom.copyMedia', 'nonDicom.print', 'nonDicom.video', 'export.read', 'export.create', 'backup.read', 'destructive.request', 'release.read', 'uat.read', 'uat.execute', 'training.read', 'training.attest', 'incident.read', 'incident.report', 'change.read', 'change.request', 'account.selfManage', 'ops.health', 'ops.dicomConformance', 'quality.read', 'quality.criticalResult', 'quality.qc', 'commandCenter.read', 'alerts.read', 'alerts.ack', 'dataQuality.read'],
      isSystem: true,
      isActive: true
    },
    {
      code: 'RECEPTION',
      name: 'Lễ tân',
      description: 'Tạo order, check-in, tìm/in lại kết quả và xem thống kê vận hành cơ bản.',
      baseRole: Role.RECEPTION,
      permissions: ['studies.read', 'worklist.manage', 'archive.read', 'archive.deliver', 'statistics.read', 'reports.print', 'his.read', 'his.sync', 'his.retry', 'nonDicom.read', 'nonDicom.create', 'export.read', 'export.create', 'release.read', 'uat.read', 'uat.execute', 'training.read', 'training.attest', 'incident.read', 'incident.report', 'change.read', 'change.request', 'account.selfManage', 'quality.read', 'commandCenter.read', 'alerts.read', 'dataQuality.read'],
      isSystem: true,
      isActive: true
    }
  ];

  const roleProfileByCode: Record<string, { id: string }> = {};
  for (const roleProfile of roleProfiles) {
    roleProfileByCode[roleProfile.code] = await prisma.appRoleProfile.upsert({
      where: { code: roleProfile.code },
      update: roleProfile,
      create: roleProfile
    });
  }

  const secretaryRole = await prisma.appRoleProfile.findUnique({
    where: { code: 'DOCTOR_SECRETARY' }
  });
  if (!secretaryRole) {
    await prisma.appRoleProfile.create({
      data: {
        code: 'DOCTOR_SECRETARY',
        name: 'Thư ký bác sĩ',
        description: 'Chỉ tra cứu Archive và in lại kết quả theo phân công của bác sĩ.',
        baseRole: Role.RECEPTION,
        permissions: ['archive.read'],
        isSystem: false,
        isActive: true
      }
    });
  }

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      roleProfileId: roleProfileByCode.ADMIN.id,
      fullName: 'System Admin',
      isActive: true
    },
    create: {
      username,
      password: hashedPassword,
      role: 'ADMIN',
      roleProfileId: roleProfileByCode.ADMIN.id,
      fullName: 'System Admin',
      isActive: true
    }
  });

  console.log(`Admin user seeded: ${admin.username}`);

  const reportTemplateTexts = [
    {
      name: 'Phổi bình thường',
      modality: 'DX',
      bodyPart: 'CHEST',
      shortcut: '/phoi',
      findings: 'Bóng tim không to. Hai phế trường sáng. Không thấy tổn thương nhu mô/ke khu trú. Không tràn dịch, tràn khí màng phổi.',
      conclusion: 'Tim phổi trong giới hạn bình thường.',
      recommendation: '',
      isNormal: true,
      isActive: true,
      scope: 'GLOBAL'
    },
    {
      name: 'Siêu âm ổ bụng tổng quát bình thường',
      modality: 'US',
      bodyPart: 'ABDOMEN',
      shortcut: '/sab',
      findings: 'Gan không to, nhu mô đều. Đường mật trong gan không giãn. Túi mật không sỏi. Tụy, lách, hai thận chưa ghi nhận bất thường. Không thấy dịch tự do ổ bụng.',
      conclusion: 'Siêu âm ổ bụng chưa ghi nhận bất thường.',
      recommendation: '',
      isNormal: true,
      isActive: true,
      scope: 'GLOBAL'
    }
  ];

  for (const template of reportTemplateTexts) {
    const existing = await prisma.reportTemplateText.findFirst({
      where: {
        shortcut: template.shortcut,
        modality: template.modality,
        scope: 'GLOBAL'
      }
    });

    if (!existing) {
      await prisma.reportTemplateText.create({ data: template });
    }
  }

  console.log(`Report text templates seeded: ${reportTemplateTexts.length}`);

  const existingClinicProfile = await prisma.clinicProfile.findFirst();
  if (!existingClinicProfile) {
    await prisma.clinicProfile.create({
      data: {
        name: 'Mini PACS',
        legalName: 'Mini PACS Diagnostic Imaging',
        address: '',
        phone: '',
        email: '',
        website: '',
        headerText: 'Hệ thống chẩn đoán hình ảnh',
        footerText: 'Phiếu kết quả được phát hành từ hệ thống Mini PACS.',
        licenseNumber: '',
        defaultReportLanguage: 'vi'
      }
    });
    console.log('Clinic profile seeded: Mini PACS');
  }
  // Seed UAT Baseline Scenarios if json file exists
  const uatJsonPath = path.join(__dirname, 'uat-baseline.json');
  if (fs.existsSync(uatJsonPath)) {
    const cases = JSON.parse(fs.readFileSync(uatJsonPath, 'utf8'));
    const suite = await prisma.uatSuite.upsert({
      where: { id: 'baseline-parity-suite' },
      update: {
        name: 'VRPACS Baseline Parity',
        description: 'Acceptance scenarios for VRPACS core workflows',
        version: '1.0'
      },
      create: {
        id: 'baseline-parity-suite',
        name: 'VRPACS Baseline Parity',
        description: 'Acceptance scenarios for VRPACS core workflows',
        version: '1.0'
      }
    });

    for (const c of cases) {
      const existing = await prisma.uatCase.findFirst({
        where: { suiteId: suite.id, title: c.title }
      });
      if (!existing) {
        await prisma.uatCase.create({
          data: {
            suiteId: suite.id,
            title: c.title,
            category: c.category,
            description: c.description || 'No preconditions',
            steps: c.steps || 'No steps',
            expected: c.expected || 'No expected result',
            isCritical: c.isCritical || false
          }
        });
      }
    }
    console.log(`Seeded ${cases.length} UAT cases from uat-baseline.json`);
  }

  // Phase 11: Seed default SLA Policies
  const slaPolicies = [
    {
      code: 'GLOBAL_E2E_24H',
      name: 'Default End-to-End SLA (24h)',
      scope: 'GLOBAL',
      stage: 'END_TO_END',
      thresholdMinutes: 1440,
      warningThresholdMinutes: 1200,
      severity: 'HIGH',
      description: 'Global 24-hour SLA for all studies from check-in to final delivery.'
    },
    {
      code: 'GLOBAL_FIRST_READ_60M',
      name: 'Default First Read SLA (60m)',
      scope: 'GLOBAL',
      stage: 'RECEIVED_TO_FIRST_READ',
      thresholdMinutes: 60,
      warningThresholdMinutes: 45,
      severity: 'MEDIUM',
      description: 'Global 1-hour SLA for a doctor to open the study.'
    }
  ];

  for (const policy of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { code: policy.code },
      update: policy,
      create: policy
    });
  }
  console.log(`SLA Policies seeded: ${slaPolicies.length}`);

  // Phase 11: Seed default Control Threshold Policies
  const controlPolicies = [
    {
      code: 'STUCK_IN_DRAFT_1H',
      groupKey: 'WORKFLOW_QUEUE',
      metricKey: 'STUCK_IN_DRAFT',
      name: 'Studies stuck in draft',
      scopeType: 'GLOBAL',
      operator: '>=',
      warningValue: 5,
      criticalValue: 10,
      unit: 'count',
      evaluationWindowMinutes: 60,
      escalationMode: 'ALERT',
      description: 'Alert if more than 10 studies are stuck in draft for over an hour.'
    },
    {
      code: 'DICOM_ECHO_FAIL_15M',
      groupKey: 'PACS_DICOM',
      metricKey: 'DICOM_ECHO_FAIL',
      name: 'DICOM Node Echo Failures',
      scopeType: 'GLOBAL',
      operator: '>=',
      warningValue: 1,
      criticalValue: 3,
      unit: 'count',
      evaluationWindowMinutes: 15,
      escalationMode: 'ALERT',
      description: 'Alert if DICOM echo fails 3 times in 15 minutes.'
    }
  ];

  for (const policy of controlPolicies) {
    await prisma.controlThresholdPolicy.upsert({
      where: { code: policy.code },
      update: policy,
      create: policy
    });
  }
  console.log(`Control Threshold Policies seeded: ${controlPolicies.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
