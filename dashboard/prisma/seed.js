const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      fullName: 'System Admin',
      isActive: true,
    },
    create: {
      username,
      password: hashedPassword,
      role: 'ADMIN',
      fullName: 'System Admin',
      isActive: true,
    },
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
      scope: 'GLOBAL',
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
      scope: 'GLOBAL',
    },
  ];

  for (const template of reportTemplateTexts) {
    const existing = await prisma.reportTemplateText.findFirst({
      where: {
        shortcut: template.shortcut,
        modality: template.modality,
        scope: 'GLOBAL',
      },
    });

    if (!existing) {
      await prisma.reportTemplateText.create({ data: template });
    }
  }

  console.log(`Report text templates seeded: ${reportTemplateTexts.length}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
