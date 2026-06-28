import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { uid: string } }) {
  // Mock history data
  return NextResponse.json([
    {
      studyInstanceUid: params.uid + '-prev1',
      studyDate: '2023-05-12',
      modality: 'CT',
      studyDescription: 'CT Đầu (Không tiêm thuốc cản quang)',
      status: 'REPORTED',
      reportUrl: `/report/${params.uid}-prev1`,
    },
    {
      studyInstanceUid: params.uid + '-prev2',
      studyDate: '2022-01-20',
      modality: 'MR',
      studyDescription: 'MRI Sọ não (Có tiêm thuốc)',
      status: 'DRAFT',
    }
  ]);
}
