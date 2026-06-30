import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/app/db';
import { hasPermission } from '@/lib/permissions';
import { orthancClient } from '@/lib/orthancClient';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Ban chua dang nhap.' }, { status: 401 });
  }

  if (!hasPermission(session.user.role, 'studies.read', session.user.permissions)) {
    return NextResponse.json({ ok: false, message: 'Ban khong co quyen xem ca chup.' }, { status: 403 });
  }

  const warnings: string[] = [];
  let dbOk = false;
  try {
    // Simple fast query to check DB
    await prisma.user.count();
    dbOk = true;
  } catch (error) {
    console.error('Diagnostics DB check failed:', error);
    warnings.push('Database connection failed.');
  }

  let dicomwebOk = false;
  let dicomwebMessage = 'Missing Configuration';
  
  if (process.env.ORTHANC_API_URL) {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
      await Promise.race([orthancClient.getSystem(), timeoutPromise]);
      dicomwebOk = true;
      dicomwebMessage = 'Connected';
    } catch (err: any) {
      console.error('Diagnostics DICOMweb check failed:', err);
      warnings.push(`DICOMweb connection failed: ${err.message}`);
      dicomwebMessage = 'Connection Error';
    }
  } else {
    warnings.push('DICOMweb config (ORTHANC_API_URL) is missing.');
  }

  const diagnostics = {
    ok: dbOk && dicomwebOk,
    timestamp: new Date().toISOString(),
    services: {
      auth: {
        ok: true,
        userId: session.user.id,
        permissions: session.user.permissions || [],
      },
      database: {
        ok: dbOk,
      },
      dicomweb: {
        ok: dicomwebOk,
        message: dicomwebMessage,
      },
      viewerApi: {
        ok: true,
      },
      reportWorkspace: {
        ok: true,
        enabled: true,
      },
    },
    warnings,
  };

  return NextResponse.json(diagnostics, { status: 200 });
}
