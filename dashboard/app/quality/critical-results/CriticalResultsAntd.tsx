"use client";

import React from "react";
import { Table, Tag, Typography } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ liên hệ",
  CONTACTED: "Đã liên hệ",
  COMMUNICATED: "Đã liên hệ",
  FAILED: "Liên hệ thất bại",
  PENDING_ACK: "Chờ xác nhận",
  ACKNOWLEDGED: "Đã xác nhận",
  ESCALATED: "Đã chuyển cấp",
  CANCELLED: "Đã hủy",
};

export function CriticalResultsAntd({ results }: { results: any[] }) {
  const columns = [
    {
      title: "Ca chụp (Study ID)",
      dataIndex: "imagingStudyId",
      key: "imagingStudyId",
      render: (text: string) => (
        <Text style={{ fontFamily: "monospace", fontSize: 13, color: "var(--vin-text)" }}>
          {text.length > 30 ? `${text.substring(0, 30)}…` : text}
        </Text>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      key: "severity",
      render: (text: string) => <Tag color="error">{text || "CRITICAL"}</Tag>,
    },
    {
      title: "Liên lạc",
      key: "communicationStatus",
      render: (_: unknown, record: any) => {
        const status = record.status || record.communicationStatus || "PENDING";
        const color =
          status === "PENDING" || status === "PENDING_ACK"
            ? "warning"
            : status === "CONTACTED" || status === "COMMUNICATED" || status === "ACKNOWLEDGED"
            ? "success"
            : status === "FAILED" || status === "ESCALATED"
            ? "error"
            : "default";
        return <Tag color={color}>{STATUS_LABELS[status] || status}</Tag>;
      },
    },
    {
      title: "Người nhận",
      dataIndex: "recipientName",
      key: "recipientName",
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text || "Chưa chỉ định"}</Text>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date(text).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <ScreenHeader />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
          Quản lý các kết quả nguy hiểm cần thông báo lâm sàng khẩn cấp.
        </Text>
      </div>

      <div style={{ background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 8, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border)", background: "rgba(0,0,0,0.2)" }}>
          <Text strong style={{ fontSize: 14 }}>Kết quả nguy hiểm đang theo dõi</Text>
        </div>
        <Table
          size="middle"
          columns={columns}
          dataSource={results}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ y: "calc(100vh - 280px)" }}
        />
      </div>
    </div>
  );
}
