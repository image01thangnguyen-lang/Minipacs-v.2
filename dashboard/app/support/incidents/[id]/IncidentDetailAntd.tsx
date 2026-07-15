"use client";

import React, { useState } from "react";
import { Card, Tag, Typography, Button, Space, Descriptions, Select, Form, Input, Checkbox, Avatar, List, App, Alert, theme } from "antd";
import { ArrowLeftOutlined, MessageOutlined, WarningOutlined, UserOutlined, ClockCircleOutlined, SettingOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { addIncidentComment } from "../actions";
import { useRouter } from "next/navigation";

const { Text, Title, Paragraph } = Typography;

export function IncidentDetailAntd({
  ticket,
  comments,
  assigneeOptions,
  isAdmin,
  onUpdateStatus,
  onAssign,
}: {
  ticket: any;
  comments: any[];
  assigneeOptions: any[];
  isAdmin: boolean;
  onUpdateStatus: (formData: FormData) => Promise<void>;
  onAssign: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [commentForm] = Form.useForm();
  const [submittingComment, setSubmittingComment] = useState(false);

  const severityColor =
    ticket.severity === "SEV1"
      ? "#f5222d"
      : ticket.severity === "SEV2"
      ? "#fa541c"
      : ticket.severity === "SEV3"
      ? "#faad14"
      : "default";

  const statusColor =
    ticket.status === "RESOLVED"
      ? "success"
      : ticket.status === "CLOSED"
      ? "default"
      : ticket.status === "INVESTIGATING"
      ? "processing"
      : "warning";

  const handleStatusChange = async (value: string) => {
    const formData = new FormData();
    formData.append("status", value);
    try {
      await onUpdateStatus(formData);
      message.success("Cập nhật trạng thái thành công");
    } catch (e: any) {
      message.error(e.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleAssigneeChange = async (value: string) => {
    const formData = new FormData();
    formData.append("assigneeUserId", value);
    try {
      await onAssign(formData);
      message.success("Cập nhật người phụ trách thành công");
    } catch (e: any) {
      message.error(e.message || "Không thể cập nhật người phụ trách");
    }
  };

  const handleAddComment = async (values: any) => {
    if (!values.isScrubbed) {
      message.error("Bạn phải xác nhận không có PHI trong bình luận.");
      return;
    }
    setSubmittingComment(true);
    try {
      await addIncidentComment(ticket.id, values.content, values.isScrubbed);
      commentForm.resetFields();
      message.success("Đã thêm bình luận");
      router.refresh();
    } catch (e: any) {
      message.error(e.message || "Lỗi khi đăng bình luận");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <Link href="/support/incidents">
          <Button size="middle" type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 16 }}>
            Quay lại danh sách
          </Button>
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <ScreenHeader />
            <Title level={4} style={{ margin: "8px 0 4px 0", color: token.colorText }}>
              Sự cố #{ticket.id.substring(0, 8)}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Được báo cáo vào {new Date(ticket.createdAt).toLocaleDateString()} bởi {ticket.reportedByUser?.fullName || "System"}
            </Text>
          </div>
          <Space>
            <Tag color={severityColor} style={{ fontWeight: "bold", padding: "4px 8px", fontSize: 13 }}>
              {ticket.severity}
            </Tag>
            <Tag color={statusColor} style={{ fontWeight: "bold", padding: "4px 8px", fontSize: 13 }}>
              {ticket.status}
            </Tag>
          </Space>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Card title={<span style={{ textTransform: "uppercase", fontSize: 12, color: "gray" }}>Mô tả chi tiết</span>}>
            <Paragraph style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 14 }}>
              {ticket.shortDesc}
            </Paragraph>
          </Card>

          <Card title={<Space><MessageOutlined style={{ color: "var(--vin-accent)" }} /> Bình luận & Cập nhật</Space>} bodyStyle={{ padding: 0 }}>
            <List
              itemLayout="horizontal"
              dataSource={comments}
              locale={{ emptyText: "Chưa có bình luận nào." }}
              style={{ padding: "0 16px" }}
              renderItem={(c) => (
                <List.Item style={{ borderBottom: "1px solid var(--vin-border)", padding: "16px 0" }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: "var(--vin-shell)" }} />}
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ color: token.colorText }}>{c.createdByUser?.fullName || "System"}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}><ClockCircleOutlined /> {new Date(c.createdAt).toLocaleString()}</Text>
                      </div>
                    }
                    description={<div style={{ whiteSpace: "pre-wrap", marginTop: 8, color: "var(--vin-text)" }}>{c.content}</div>}
                  />
                </List.Item>
              )}
            />
            <div style={{ padding: 16, background: "rgba(0,0,0,0.2)", borderTop: "1px solid var(--vin-border)" }}>
              <Form form={commentForm} layout="vertical" onFinish={handleAddComment} initialValues={{ isScrubbed: false }}>
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  message="Không nhập dữ liệu PHI (Bệnh nhân, MRN, Accession) vào bình luận."
                  style={{ marginBottom: 16, fontSize: 12, padding: "8px 12px" }}
                />
                <Form.Item name="content" rules={[{ required: true, message: "Nhập nội dung" }]} style={{ marginBottom: 12 }}>
                  <Input.TextArea size="middle" rows={3} placeholder="Nhập bình luận hoặc cập nhật mới..." />
                </Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Form.Item name="isScrubbed" valuePropName="checked" style={{ marginBottom: 0 }}>
                    <Checkbox>
                      <Text style={{ fontSize: 12 }}>Tôi xác nhận không có dữ liệu PHI.</Text>
                    </Checkbox>
                  </Form.Item>
                  <Button size="middle" type="primary" htmlType="submit" loading={submittingComment} icon={<MessageOutlined />}>
                    Gửi bình luận
                  </Button>
                </div>
              </Form>
            </div>
          </Card>
        </Space>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Card title="Thông tin chi tiết">
            <Descriptions column={1} size="middle" labelStyle={{ color: token.colorTextSecondary, fontSize: 12 }} contentStyle={{ color: token.colorText, fontSize: 13, fontWeight: 500 }}>
              <Descriptions.Item label="Module">{ticket.module}</Descriptions.Item>
              <Descriptions.Item label="Loại ngữ cảnh">{ticket.contextType || "Không"}</Descriptions.Item>
              <Descriptions.Item label="ID ngữ cảnh">{ticket.contextId || "Không"}</Descriptions.Item>
              {ticket.contextUrl?.startsWith("/") && !ticket.contextUrl.startsWith("//") && (
                <Descriptions.Item label="Link ngữ cảnh">
                  <Link href={ticket.contextUrl} style={{ color: "var(--vin-accent)", textDecoration: "underline" }}>
                    Mở trang liên quan
                  </Link>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Người phụ trách">{ticket.assigneeUser?.fullName || "Chưa phân công"}</Descriptions.Item>
            </Descriptions>
          </Card>

          {isAdmin && (
            <Card title={<Space><SettingOutlined /> Tác vụ Quản trị</Space>}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: "block" }}>Trạng thái sự cố</Text>
                <Select
                  size="middle"
                  value={ticket.status}
                  onChange={handleStatusChange}
                  style={{ width: "100%" }}
                  options={[
                    { value: "OPEN", label: "OPEN" },
                    { value: "INVESTIGATING", label: "INVESTIGATING" },
                    { value: "RESOLVED", label: "RESOLVED" },
                    { value: "CLOSED", label: "CLOSED" },
                  ]}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: "block" }}>Người phụ trách</Text>
                <Select
                  size="middle"
                  value={ticket.assigneeUserId || ""}
                  onChange={handleAssigneeChange}
                  style={{ width: "100%" }}
                  showSearch
                  optionFilterProp="label"
                  options={[
                    { value: "", label: "Chưa phân công" },
                    ...assigneeOptions.map(u => ({ value: u.id, label: `${u.fullName} (${u.role})` }))
                  ]}
                />
              </div>
            </Card>
          )}
        </Space>
      </div>
    </div>
  );
}
