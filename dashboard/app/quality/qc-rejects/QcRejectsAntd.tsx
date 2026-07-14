"use client";

import React from "react";
import { Table, Tag, Typography } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  REJECTED: "Từ chối",
};

export function QcRejectsAntd({ issues }: { issues: any[] }) {
  const columns = [
    {
      title: "Ca chụp (Study UID / ID)",
      dataIndex: "studyInstanceUid",
      key: "studyInstanceUid",
      render: (text: string, record: any) => (
        <Text style={{ fontFamily: "monospace", fontSize: 13, color: "var(--vin-text)" }}>
          {(() => {
            const identifier = record.studyInstanceUid || record.nonDicomExamId || record.id;
            return identifier.length > 30 ? `${identifier.substring(0, 30)}…` : identifier;
          })()}
        </Text>
      ),
    },
    {
      title: "Lý do từ chối",
      dataIndex: "reasonCode",
      key: "reasonCode",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "PENDING"
            ? "warning"
            : status === "RESOLVED"
            ? "success"
            : status === "REJECTED"
            ? "error"
            : "default";
        return <Tag color={color}>{STATUS_LABELS[status] || status}</Tag>;
      },
    },
    {
      title: "Người tạo",
      dataIndex: ["createdByUser", "fullName"],
      key: "createdByUser",
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text || "Không rõ"}</Text>,
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
          Quản lý các ca bị đánh giá lỗi kỹ thuật và yêu cầu chụp lại.
        </Text>
      </div>

      <div style={{ background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 8, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border)", background: "rgba(0,0,0,0.2)" }}>
          <Text strong style={{ fontSize: 14 }}>Danh sách ca bị từ chối QC</Text>
        </div>
        <Table
          size="small"
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
