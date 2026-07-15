"use client";

import React from "react";
import { Table, Tag, Typography } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

export function SlaPoliciesAntd({ policies }: { policies: any[] }) {
  const columns = [
    {
      title: "Tên chính sách",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong style={{ fontSize: 13, color: "var(--vin-text)" }}>{text}</Text>,
    },
    {
      title: "Giai đoạn",
      dataIndex: "stage",
      key: "stage",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Thời gian cam kết",
      dataIndex: "thresholdMinutes",
      key: "thresholdMinutes",
      render: (minutes: number) => {
        let text = "";
        let color = "default";
        if (minutes < 60) {
          text = `${minutes} phút`;
          color = "error";
        } else if (minutes < 1440) {
          text = `${Math.floor(minutes / 60)} giờ`;
          color = "warning";
        } else {
          text = `${Math.floor(minutes / 1440)} ngày`;
          color = "success";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>{isActive ? "Kích hoạt" : "Tạm ngưng"}</Tag>
      ),
    },
    {
      title: "Cập nhật lần cuối",
      dataIndex: "updatedAt",
      key: "updatedAt",
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
          Định nghĩa cam kết thời gian cho từng loại dịch vụ và mức ưu tiên.
        </Text>
      </div>

      <div style={{ background: "var(--vin-shell)", border: "1px solid var(--vin-border)", borderRadius: 8, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border)", background: "rgba(0,0,0,0.2)" }}>
          <Text strong style={{ fontSize: 14 }}>Danh sách chính sách SLA</Text>
        </div>
        <Table
          size="middle"
          columns={columns}
          dataSource={policies}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ y: "calc(100vh - 280px)" }}
        />
      </div>
    </div>
  );
}
