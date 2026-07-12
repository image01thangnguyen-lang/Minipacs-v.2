import { NextRequest, NextResponse } from "next/server";
import { validateToken, isValidShareCookie } from "@/lib/shareService";
import { cookies } from "next/headers";
import { prisma } from "@/app/db";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    // First validate token hash exists (no need to check password just to get config layout)
    // Actually, we should make sure the token is valid and not expired.
    const sessionCookie = cookies().get(`share_session_${token}`);
    const hasSession = isValidShareCookie(token, 'session', sessionCookie?.value);
    const context = await validateToken(token, hasSession);
    if (!context.valid) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const config = {
      routerBasename: '/viewer',
      useCursors: true,
      showStudyList: false, // Hide study list in public share mode
      extensions: [],
      modes: [],
      dataSources: [
        {
          friendlyName: 'Orthanc DICOMweb',
          namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
          sourceName: 'dicomweb',
          configuration: {
            name: 'Orthanc',
            wadoUriRoot: `/api/share/${token}/orthanc/wado`,
            qidoRoot: `/api/share/${token}/orthanc/dicom-web`,
            wadoRoot: `/api/share/${token}/orthanc/dicom-web`,
            qidoSupportsIncludeField: false,
            imageRendering: 'wadors',
            thumbnailRendering: 'wadors',
            enableStudyLazyLoad: true,
            supportsFuzzyMatching: false,
            supportsWildcard: true,
            dicomUploadEnabled: false,
            omitQuotationForMultipartRequest: true,
          },
        },
      ],
      defaultDataSourceName: 'dicomweb',
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error generating OHIF config", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
