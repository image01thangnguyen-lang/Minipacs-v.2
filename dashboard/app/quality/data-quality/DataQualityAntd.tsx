"use client";

import React from "react";
import { Table, Tag, Typography } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  SUPPRESSED: "Tạm ẩn",
};

export function DataQualityAntd({ issues }: { issues: any[] }) {
  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <Text strong style={{ fontSize: 13, color: "var(--vin-text)" }}>{text}</Text>,
    },
    {
      title: "Loại thực thể",
      dataIndex: "entityType",
      key: "entityType",
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "NEW" || status === "OPEN"
            ? "error"
            : status === "RESOLVED"
            ? "success"
            : "default";
        return <Tag color={color}>{STATUS_LABELS[status] || status}</Tag>;
      },
    },
    {
      title: "Ngày phát hiện",
      dataIndex: "detectedAt",
      key: "detectedAt",
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
          Phát hiện dữ liệu bất thường: sai thông tin hành chính hoặc mất đồng bộ HIS.
        </Text>
      </div>

      <div style={{ background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 8, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border)", background: "rgba(0,0,0,0.2)" }}>
          <Text strong style={{ fontSize: 14 }}>Cảnh báo dữ liệu</Text>
        </div>
        <Table
          size="middle"
          columns={columns}
          dataSource={issues}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ y: "calc(100vh - 280px)" }}
        />
      </div>
    </div>
  );
}
