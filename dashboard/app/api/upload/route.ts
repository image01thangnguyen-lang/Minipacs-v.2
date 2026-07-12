import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Determine the base upload directory.
// Inside Docker (based on our docker-compose), it's mounted to /app/pacs_data/report_images
// If running locally, we fallback to a relative path.
const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/app/pacs_data/report_images'
  : path.resolve(process.cwd(), '../pacs_data/report_images');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate secure UUID hash for filename to prevent Path Traversal and collisions
    const hash = crypto.randomUUID();
    const ext = path.extname(file.name) || (file.type === "image/jpeg" ? ".jpg" : ".png");
    const filename = `${hash}${ext}`;

    const filePath = path.join(UPLOAD_DIR, filename);

    // Save the file physically
    await writeFile(filePath, buffer);

    // Return the URL for the rich text editor to consume
    const imageUrl = `/api/images/${filename}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename: filename
    }, { status: 201 });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload image due to a server error." }, { status: 500 });
  }
}
