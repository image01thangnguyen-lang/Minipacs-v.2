"use client";

import React, { useState } from "react";
import { Form, Input, Select, Checkbox, Button, Card, Typography, Space, App, Alert, theme } from "antd";
import { ArrowLeftOutlined, WarningOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text, Title } = Typography;

export function NewIncidentAntd({
  defaultModule,
  defaultContextType,
  defaultContextId,
  defaultContextUrl,
  onSubmitAction,
}: {
  defaultModule: string;
  defaultContextType: string;
  defaultContextId: string;
  defaultContextUrl: string;
  onSubmitAction: (formData: FormData) => Promise<void>;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const { token } = theme.useToken();

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (typeof values[key] === "boolean") {
            if (values[key]) formData.append(key, "on");
          } else {
            formData.append(key, values[key]);
          }
        }
      });
      formData.append("contextUrl", defaultContextUrl);
      
      await onSubmitAction(formData);
    } catch (err: any) {
      message.error(err.message || "Failed to create incident.");
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 800, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <div>
          <Link href="/support/incidents">
            <Button size="small" type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 16 }}>
              Quay lại danh sách
            </Button>
          </Link>
          <ScreenHeader />
          <Title level={4} style={{ margin: "16px 0 4px 0", color: token.colorText }}>
            Báo cáo sự cố
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ghi nhận lỗi hệ thống hoặc yêu cầu hỗ trợ vận hành.
          </Text>
        </div>

        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={<span style={{ fontWeight: "bold" }}>QUY ĐỊNH BẮT BUỘC: KHÔNG NHẬP DỮ LIỆU PHI (BỆNH NHÂN)</span>}
          description="Không được phép bao gồm Thông tin Y tế Được bảo vệ (PHI) trong mô tả sự cố. Bao gồm: Tên bệnh nhân, Mã PID, Accession Number, hoặc bệnh án thô. Mọi dữ liệu định danh phải được xóa hoặc mã hóa (scrubbed) trước khi gửi."
        />

        <Card size="small">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              module: defaultModule,
              contextType: defaultContextType,
              contextId: defaultContextId,
              severity: "SEV4",
              containsPhiRisk: false,
            }}
          >
            <Form.Item
              name="shortDesc"
              label="Mô tả sự cố (Đã xóa dữ liệu bệnh nhân)"
              rules={[{ required: true, message: "Vui lòng nhập mô tả sự cố" }]}
            >
              <Input.TextArea
                size="small"
                rows={5}
                placeholder="Mô tả chi tiết lỗi (ví dụ: Không thể lưu kết quả cho ca X-quang)"
              />
            </Form.Item>

            <Space size={8} style={{ width: "100%", display: "flex", flexWrap: "wrap" }}>
              <Form.Item name="severity" label="Mức độ nghiêm trọng" style={{ flex: 1, minWidth: 200 }}>
                <Select
                  size="small"
                  options={[
                    { value: "SEV4", label: "SEV4 - Lỗi nhỏ / Giao diện" },
                    { value: "SEV3", label: "SEV3 - Lỗi lớn có cách xử lý tạm (Workaround)" },
                    { value: "SEV2", label: "SEV2 - Ảnh hưởng nghiêm trọng / Gián đoạn một phần" },
                    { value: "SEV1", label: "SEV1 - Khẩn cấp / Gián đoạn toàn hệ thống" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="module" label="Module bị lỗi" style={{ flex: 1, minWidth: 200 }}>
                <Select
                  size="small"
                  options={[
                    { value: "GENERAL", label: "Hệ thống chung" },
                    { value: "VIEWER", label: "DICOM Viewer" },
                    { value: "HIS_GATEWAY", label: "HIS/EMR Gateway" },
                    { value: "REPORTING", label: "Đọc/Trả kết quả (Reporting)" },
                    { value: "STORAGE", label: "Lưu trữ (Storage/Archive)" },
                    { value: "WORKLIST", label: "Danh sách ca chụp (Worklist)" },
                    { value: "NON_DICOM", label: "Ảnh ngoài DICOM (Non-DICOM)" },
                    { value: "SHARING", label: "Chia sẻ / Hội chẩn" },
                    { value: "OPS", label: "Vận hành (Operations)" },
                  ]}
                />
              </Form.Item>
            </Space>

            <Space size={8} style={{ width: "100%", display: "flex", flexWrap: "wrap" }}>
              <Form.Item name="contextType" label="Loại ngữ cảnh (Không bắt buộc)" style={{ flex: 1, minWidth: 200 }}>
                <Select
                  size="small"
                  options={[
                    { value: "", label: "Không có" },
                    { value: "STUDY", label: "Ca chụp (Study)" },
                    { value: "REPORT", label: "Kết quả (Report)" },
                    { value: "ORDER", label: "Chỉ định (Order)" },
                    { value: "DICOM_NODE", label: "Node DICOM" },
                    { value: "EXPORT_JOB", label: "Tác vụ xuất file (Export Job)" },
                    { value: "HIS_LOG", label: "HIS Log" },
                    { value: "URL", label: "Đường dẫn (URL)" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="contextId" label="ID ngữ cảnh (ID hệ thống, không dùng Accession)" style={{ flex: 1, minWidth: 200 }}>
                <Input size="small" placeholder="Nhập UUID hoặc ID hệ thống" />
              </Form.Item>
            </Space>

            {defaultContextUrl && (
              <div style={{ padding: "8px 12px", background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 4, marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Link ngữ cảnh: <Text code>{defaultContextUrl}</Text>
                </Text>
              </div>
            )}

            <div style={{ borderTop: "1px dashed var(--vin-border)", paddingTop: 16, marginBottom: 24 }}>
              <Form.Item name="containsPhiRisk" valuePropName="checked" style={{ marginBottom: 4 }}>
                <Checkbox>
                  <Text type="danger" strong>Cảnh báo: Mô tả có chứa hoặc nguy cơ chứa dữ liệu PHI.</Text>
                </Checkbox>
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 24, display: "block" }}>
                Nếu chọn ô này, hệ thống sẽ chặn gửi sự cố. Bạn BẮT BUỘC phải xóa dữ liệu bệnh nhân trước, và bỏ tick ô này để xác nhận an toàn.
              </Text>
            </div>

            <Button size="small" type="primary" htmlType="submit" loading={saving} block>
              Gửi báo cáo sự cố
            </Button>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
