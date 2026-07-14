"use client";

import React from "react";
import { Table, Tag, Typography } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ đánh giá",
  COMPLETED: "Hoàn tất",
  DISCREPANCY_FOUND: "Có sai lệch",
  CANCELLED: "Đã hủy",
};

export function PeerReviewAntd({ reviews }: { reviews: any[] }) {
  const columns = [
    {
      title: "Ca chụp (Study UID)",
      dataIndex: "studyInstanceUid",
      key: "studyInstanceUid",
      render: (text: string) => (
        <Text style={{ fontFamily: "monospace", fontSize: 13, color: "var(--vin-text)" }}>
          {text.length > 30 ? `${text.substring(0, 30)}…` : text}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "PENDING"
            ? "warning"
            : status === "COMPLETED"
            ? "success"
            : status === "DISCREPANCY_FOUND"
            ? "error"
            : "default";
        return <Tag color={color}>{STATUS_LABELS[status] || status}</Tag>;
      },
    },
    {
      title: "BS Đọc ban đầu",
      dataIndex: ["originalDoctor", "fullName"],
      key: "originalDoctor",
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text || "Không rõ"}</Text>,
    },
    {
      title: "BS Đánh giá",
      dataIndex: ["reviewer", "fullName"],
      key: "reviewer",
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text || "Chưa phân công"}</Text>,
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
          Thực hiện đánh giá chéo kết quả giữa các bác sĩ và ghi nhận sai lệch chẩn đoán.
        </Text>
      </div>

      <div style={{ background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 8, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border)", background: "rgba(0,0,0,0.2)" }}>
          <Text strong style={{ fontSize: 14 }}>Danh sách ca chờ đánh giá</Text>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ y: "calc(100vh - 280px)" }}
        />
      </div>
    </div>
  );
}
