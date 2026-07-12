import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/app/pacs_data/report_images'
  : path.resolve(process.cwd(), '../pacs_data/report_images');

export async function GET(req: NextRequest, props: { params: Promise<{ hash: string }> }) {
  try {
    const { hash: filename } = await props.params;

    // Security: Prevent path traversal (e.g. ../../etc/passwd)
    // Only allow alphanumeric characters, hyphens (for UUID), and common image extensions
    if (!/^[a-zA-Z0-9\-]+\.(jpg|jpeg|png|webp|gif)$/.test(filename)) {
      return new NextResponse('Invalid filename.', { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // Verify the resolved path is strictly within the UPLOAD_DIR
    const resolvedFilePath = path.resolve(filePath);
    if (!resolvedFilePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return new NextResponse('Forbidden access.', { status: 403 });
    }

    if (!fs.existsSync(resolvedFilePath)) {
      return new NextResponse('Image not found.', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resolvedFilePath);

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    // Set cache control for performance
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse('Internal Server Error.', { status: 500 });
  }
}
