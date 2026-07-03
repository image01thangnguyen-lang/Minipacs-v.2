import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
        'admin.catalogs',
        'admin.facilities',
        'admin.permissions',
        'admin.storage'
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
        'his.retry'
      ],
      isSystem: true,
      isActive: true
    },
    {
      code: 'TECHNICIAN',
      name: 'Kỹ thuật viên',
      description: 'Theo dõi danh sách ca, tiếp nhận/worklist và xử lý vận hành kỹ thuật.',
      baseRole: Role.TECHNICIAN,
      permissions: ['studies.read', 'studies.assign', 'studies.updateClinical', 'worklist.manage', 'archive.read', 'statistics.read', 'his.read', 'his.sync', 'his.retry'],
      isSystem: true,
      isActive: true
    },
    {
      code: 'RECEPTION',
      name: 'Lễ tân',
      description: 'Tạo order, check-in, tìm/in lại kết quả và xem thống kê vận hành cơ bản.',
      baseRole: Role.RECEPTION,
      permissions: ['studies.read', 'worklist.manage', 'archive.read', 'archive.deliver', 'statistics.read', 'reports.print', 'his.read', 'his.sync', 'his.retry'],
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
