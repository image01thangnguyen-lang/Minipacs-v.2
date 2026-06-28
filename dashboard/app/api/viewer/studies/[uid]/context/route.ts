import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  // Mock context data
  return NextResponse.json({
    patientName: 'Nguyen Van A (Mock)',
    patientId: 'PID-12345',
    accessionNumber: 'ACC-98765',
    studyStatus: 'IN_PROGRESS',
    reportStatus: 'DRAFT',
    assignedDoctor: 'Dr. B',
    previousStudyCount: 2,
  });
}
