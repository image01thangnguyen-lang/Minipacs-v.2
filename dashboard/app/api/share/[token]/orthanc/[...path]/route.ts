import { NextResponse } from 'next/server';
import { validateToken, isValidShareCookie } from '@/lib/shareService';
import { cookies } from 'next/headers';

// This is a minimal proxy to Orthanc for the public share viewer
// It MUST validate the token and ensure the requested path is scoped to the allowed Study/Series/Instance.
export async function GET(request: Request, { params }: { params: { token: string, path: string[] } }) {
  const { token, path } = params;
  
  const sessionCookie = cookies().get(`share_session_${token}`);
  const hasSession = isValidShareCookie(token, 'session', sessionCookie?.value);
  const { valid, shareLink } = await validateToken(token, hasSession);
  if (!valid || !shareLink) {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  if (shareLink.passwordRequired) {
    const authCookie = cookies().get(`share_auth_${token}`);
    if (!isValidShareCookie(token, 'auth', authCookie?.value)) {
      return new NextResponse('Unauthorized: Password required', { status: 401 });
    }
  }

  if (!shareLink.allowImages) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const joinedPath = path.join('/');
  
  if (shareLink.studyInstanceUid) {
    const url = new URL(request.url);
    let isAllowed = false;

    if (joinedPath.startsWith('dicom-web/studies/')) {
      const parts = joinedPath.split('/');
      // parts[0] = 'dicom-web', parts[1] = 'studies', parts[2] = <studyUid>
      if (parts[2] === shareLink.studyInstanceUid) {
        isAllowed = true;
      }
    } else if (joinedPath === 'dicom-web/studies' || joinedPath === 'dicom-web/studies/') {
      const qidoUid = url.searchParams.get('StudyInstanceUID');
      if (qidoUid === shareLink.studyInstanceUid) {
        isAllowed = true;
      }
    } else if (joinedPath === 'wado') {
      const wadoUid = url.searchParams.get('studyUID');
      if (wadoUid === shareLink.studyInstanceUid) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return new NextResponse('Forbidden: Scope violation', { status: 403 });
    }
  }

  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    const searchParams = new URL(request.url).search;
    const targetUrl = `${orthancUrl}/${joinedPath}${searchParams}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Accept': request.headers.get('Accept') || '*/*',
      },
      cache: 'no-store'
    });

    const headers = new Headers(response.headers);
    // Remove auth headers if any leaked
    headers.delete('set-cookie');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
