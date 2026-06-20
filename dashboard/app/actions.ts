'use server'

import { prisma } from './db';
import { syncOrthancStudyToRis, updateStudyStatusForReport } from '@/lib/studyStatus';

/**
 * Server Action: Lấy danh sách bệnh nhân/studies từ Orthanc.
 * BẢO MẬT: Fetch từ backend, không làm lộ mật khẩu Orthanc ra frontend.
 */
export async function getStudies() {
  // Lấy cấu hình từ biến môi trường của Docker container
  const orthancUrl = process.env.ORTHANC_API_URL || 'http://orthanc:8042';
  const username = process.env.ORTHANC_USERNAME || 'admin';
  const password = process.env.ORTHANC_PASSWORD || 'admin_password';

  try {
    const response = await fetch(`${orthancUrl}/studies?expand`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Accept': 'application/json'
      },
      // Không cache để luôn có ảnh mới nhất
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Orthanc error: ${response.status} ${response.statusText}`);
      return [];
    }

    const studies = await response.json();

    // Làm giàu dữ liệu (Enrichment): Lấy Modality và đếm số lượng Instances (Lát cắt)
    const enrichedStudies = await Promise.all(studies.map(async (study: any) => {
      let modality = study.MainDicomTags?.Modality || 'UNKNOWN';
      let instancesCount = 0;

      // 1. Phân tích Modality từ Series nếu Study root không có
      if (modality === 'UNKNOWN' && study.Series && study.Series.length > 0) {
        if (typeof study.Series[0] === 'string') {
          try {
             const seriesRes = await fetch(`${orthancUrl}/series/${study.Series[0]}`, {
               headers: {
                 'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                 'Accept': 'application/json'
               },
               cache: 'no-store'
             });
             if (seriesRes.ok) {
               const seriesData = await seriesRes.json();
               modality = seriesData.MainDicomTags?.Modality || 'UNKNOWN';
             }
           } catch (e) {
             console.error("Failed to fetch series for modality:", e);
           }
        }
      }

      // 2. Đếm tổng số Instances bằng API statistics của Orthanc
      try {
        const statsRes = await fetch(`${orthancUrl}/studies/${study.ID}/statistics`, {
           headers: {
             'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
             'Accept': 'application/json'
           },
           cache: 'no-store'
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          instancesCount = statsData.CountInstances || 0;
        }
      } catch (e) {
        console.error("Failed to fetch study statistics:", e);
      }

      return {
        ...study,
        // Trả các thuộc tính xử lý trước xuống Frontend
        EnrichedModality: modality,
        EnrichedInstancesCount: instancesCount
      };
    }));

    const studiesWithWorkflow = await Promise.all(enrichedStudies.map(async (study: any) => {
      try {
        const workflow = await syncOrthancStudyToRis(study);
        return {
          ...study,
          WorkflowStatus: workflow?.status || 'READY_TO_READ',
          OrderStatus: workflow?.orderStatus || null,
        };
      } catch (error) {
        console.error('Failed to sync study workflow status:', error);
        return {
          ...study,
          WorkflowStatus: 'ERROR',
          OrderStatus: null,
        };
      }
    }));

    return studiesWithWorkflow;
  } catch (error) {
    console.error('Failed to fetch from Orthanc:', error);
    return [];
  }
}

/**
 * Server Action: Lưu kết quả chẩn đoán (RIS Report) vào Database Postgres thông qua Prisma.
 * Thực hiện cơ chế UPSERT thông minh: Tạo mới nếu ca chụp chưa có báo cáo, ngược lại cập nhật đè lên bản cũ.
 */
export async function saveReportAction(data: {
  studyInstanceUid: string;
  findings: string;
  conclusion: string;
  recommendation: string;
  status: 'DRAFT' | 'FINAL';
  doctorId?: string;
}) {
  // 1. Kiểm tra và lọc dữ liệu (Data Validation)
  if (!data.studyInstanceUid || typeof data.studyInstanceUid !== 'string' || data.studyInstanceUid.trim() === '') {
    return {
      success: false,
      error: 'Mã ca chụp (StudyInstanceUID) không hợp lệ hoặc bị trống.'
    };
  }

  const validStatuses = ['DRAFT', 'FINAL'];
  if (!validStatuses.includes(data.status)) {
    return {
      success: false,
      error: 'Trạng thái báo cáo không đúng định dạng. Chỉ chấp nhận DRAFT hoặc FINAL.'
    };
  }

  try {
    // 2. Tiến hành UPSERT thông tin báo cáo
    const report = await prisma.report.upsert({
      where: {
        studyInstanceUid: data.studyInstanceUid
      },
      update: {
        findings: data.findings || '',
        conclusion: data.conclusion || '',
        recommendation: data.recommendation || '',
        status: data.status,
        // Nếu truyền doctorId thì liên kết với tài khoản bác sĩ tương ứng
        ...(data.doctorId ? { doctorId: data.doctorId } : {})
      },
      create: {
        studyInstanceUid: data.studyInstanceUid,
        findings: data.findings || '',
        conclusion: data.conclusion || '',
        recommendation: data.recommendation || '',
        status: data.status,
        ...(data.doctorId ? { doctorId: data.doctorId } : {})
      }
    });

    await updateStudyStatusForReport(data.studyInstanceUid, data.status);

    return {
      success: true,
      message: data.status === 'FINAL' ? 'Duyệt và ký số kết quả chẩn đoán thành công!' : 'Đã lưu nháp kết quả chẩn đoán thành công.',
      report
    };
  } catch (error: any) {
    console.error('Critical database error in saveReportAction:', error);
    return {
      success: false,
      error: 'Lỗi ghi nhận kết quả chẩn đoán vào cơ sở dữ liệu Postgres. Chi tiết: ' + (error.message || error)
    };
  }
}


