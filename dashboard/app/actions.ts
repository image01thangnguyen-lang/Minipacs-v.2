'use server'

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

    return enrichedStudies;
  } catch (error) {
    console.error('Failed to fetch from Orthanc:', error);
    return [];
  }
}

