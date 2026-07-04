import { prisma } from '@/app/db';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

export async function processExportJob(jobId: string, options?: { allowStaleRunning?: boolean }) {
  // Atomic claim
  const staleCutoff = new Date(Date.now() - 60 * 60 * 1000);
  const claimResult = await prisma.exportJob.updateMany({
    where: { 
      id: jobId,
      OR: [
        { status: 'PENDING' },
        ...(options?.allowStaleRunning
          ? [{ status: 'RUNNING', updatedAt: { lt: staleCutoff } }]
          : []),
      ],
    },
    data: { status: 'RUNNING', progress: 10, errorMessage: null }
  });

  if (claimResult.count === 0) return; // Already claimed or cancelled

  const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {

    const exportsDir = process.env.EXPORTS_ROOT_DIR || '/app/pacs_data/exports';
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `export_${randomUUID()}.zip`;
    const filePath = path.join(exportsDir, fileName);

    let fetchedFromOrthanc = false;

    // Check if it's a study export
    if (job.studyInstanceUid) {
      // Find orthanc UUID from study
      const study = await prisma.imagingStudy.findUnique({
        where: { studyInstanceUid: job.studyInstanceUid }
      });

      if (study) {
        // Here we assume Orthanc is running at ORTHANC_API_URL and we can search for the study UUID
        // Since we don't store Orthanc's internal UUID in ImagingStudy, we query Orthanc API: 
        // POST /tools/find { "Level": "Study", "Query": {"StudyInstanceUID": "..."} }
        const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
        const orthancAuth = Buffer.from(`${process.env.ORTHANC_USERNAME || 'admin'}:${process.env.ORTHANC_PASSWORD || 'orthanc'}`).toString('base64');
        
        const findRes = await fetch(`${orthancUrl}/tools/find`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${orthancAuth}`
          },
          body: JSON.stringify({
            Level: 'Study',
            Query: { StudyInstanceUID: job.studyInstanceUid }
          })
        });

        if (findRes.ok) {
          const findData = await findRes.json();
          if (findData && findData.length > 0) {
            const orthancStudyId = findData[0];
            
            // Download archive from Orthanc
            const archiveRes = await fetch(`${orthancUrl}/studies/${orthancStudyId}/archive`, {
              headers: {
                'Authorization': `Basic ${orthancAuth}`
              }
            });

            if (archiveRes.ok && archiveRes.body) {
              const fileStream = fs.createWriteStream(filePath);
              // Node.js 18+ Web Streams to Node Streams
              const readable = Readable.fromWeb(archiveRes.body as any);
              readable.pipe(fileStream);
              await finished(fileStream);
              fetchedFromOrthanc = true;
            }
          }
        }
      }
    }

    if (!fetchedFromOrthanc) {
      throw new Error('Could not fetch DICOM archive from Orthanc or unsupported type');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if cancelled before marking success
    const currentJob = await prisma.exportJob.findUnique({ where: { id: jobId } });
    if (currentJob?.status === 'CANCELLED') {
      // Clean up file if cancelled
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    const successCommit = await prisma.exportJob.updateMany({
      where: { id: jobId, status: 'RUNNING' },
      data: { 
        status: 'SUCCESS', 
        progress: 100,
        filePath,
        fileName,
        fileSizeBytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        downloadTokenHash: randomUUID(), // A secure random token
        expiresAt,
        completedAt: new Date()
      }
    });
    if (successCommit.count === 0 && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

  } catch (error: any) {
    console.error(`Export Worker Error for job ${jobId}:`, error);
    await prisma.exportJob.updateMany({
      where: { id: jobId, status: { not: 'CANCELLED' } },
      data: { 
        status: 'FAILED', 
        errorMessage: error.message,
        completedAt: new Date()
      }
    });
  }
}
