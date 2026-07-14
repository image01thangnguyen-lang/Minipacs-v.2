"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { getDataQualityMetricsAction } from "../actions";
import { Card, Row, Col, Typography, Spin, Alert, theme } from "antd";

const { Title, Text } = Typography;

export function DataQualityPanelAntd() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const { token } = theme.useToken();

  useEffect(() => {
    async function load() {
      try {
        const data = await getDataQualityMetricsAction();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Spin /></div>;
  }

  if (!metrics) {
    return <Alert message="Không thể tải thông tin chất lượng dữ liệu." type="error" />;
  }

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        {/* Unmapped Nodes */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            size="small" 
            style={{ 
              borderColor: metrics.unmappedNodesCount > 0 ? token.colorWarning : token.colorBorder,
              backgroundColor: metrics.unmappedNodesCount > 0 ? token.colorWarningBg : token.colorBgContainer 
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${metrics.unmappedNodesCount > 0 ? "bg-amber-500/20 text-amber-500" : "bg-vin-shell text-vin-muted"}`}>
                {metrics.unmappedNodesCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold">Máy chưa ánh xạ</Text>
                <Title level={3} style={{ margin: 0, color: metrics.unmappedNodesCount > 0 ? token.colorWarning : token.colorText }}>
                  {metrics.unmappedNodesCount}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* Duplicate AEs */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            size="small" 
            style={{ 
              borderColor: metrics.duplicateAeTitlesCount > 0 ? token.colorError : token.colorBorder,
              backgroundColor: metrics.duplicateAeTitlesCount > 0 ? token.colorErrorBg : token.colorBgContainer 
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${metrics.duplicateAeTitlesCount > 0 ? "bg-red-500/20 text-red-500" : "bg-vin-shell text-vin-muted"}`}>
                {metrics.duplicateAeTitlesCount > 0 ? <AlertCircle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold">Trùng AE Title</Text>
                <Title level={3} style={{ margin: 0, color: metrics.duplicateAeTitlesCount > 0 ? token.colorError : token.colorText }}>
                  {metrics.duplicateAeTitlesCount}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* Missing AEs */}
        <Col xs={24} sm={12} lg={6}>
          <Card 
            size="small" 
            style={{ 
              borderColor: metrics.missingAeTitleNodesCount > 0 ? token.colorWarning : token.colorBorder,
              backgroundColor: metrics.missingAeTitleNodesCount > 0 ? token.colorWarningBg : token.colorBgContainer 
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${metrics.missingAeTitleNodesCount > 0 ? "bg-amber-500/20 text-amber-500" : "bg-vin-shell text-vin-muted"}`}>
                {metrics.missingAeTitleNodesCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold">Thiếu AE Title</Text>
                <Title level={3} style={{ margin: 0, color: metrics.missingAeTitleNodesCount > 0 ? token.colorWarning : token.colorText }}>
                  {metrics.missingAeTitleNodesCount}
                </Title>
              </div>
            </div>
          </Card>
        </Col>

        {/* Unclassified Orders */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-vin-shell text-vin-muted">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold">CĐ chưa phân loại</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {metrics.unclassifiedOrdersCount}
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Hướng dẫn xử lý" size="small">
        <ul className="list-disc list-inside text-sm text-vin-muted space-y-1">
          <li><strong>Máy chưa ánh xạ:</strong> Chuyển sang tab "Máy chụp" và gắn đơn vị tổ chức cho các máy này. Ca chụp mới sẽ tự động thuộc về đơn vị đó.</li>
          <li><strong>Trùng/Thiếu AE Title:</strong> Kiểm tra cấu hình kết nối DICOM. Mỗi máy cần một AE Title duy nhất để đảm bảo phân quyền chính xác.</li>
          <li><strong>Ca chụp/Chỉ định chưa phân loại:</strong> Yêu cầu chạy script backfill hoặc mapper tự động để gán đơn vị tổ chức quá khứ.</li>
        </ul>
      </Card>
    </div>
  );
}
