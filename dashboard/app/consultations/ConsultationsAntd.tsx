"use client";
import React, { useState, useEffect } from "react";
import { Table, Select, Button, Space, Typography, Card, Tag } from "antd";
import { VideoCameraOutlined, ReloadOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { getConsultationsAction } from "./actions";
import { statusLabels, statusClasses } from "./utils";
import type { ConsultationView } from "./utils";

const { Text } = Typography;

export function ConsultationsAntd() {
  const [consultations, setConsultations] = useState<ConsultationView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadConsultations = async () => {
    setIsLoading(true);
    try {
      const filters = statusFilter !== "ALL" ? { status: statusFilter } : {};
      const res = await getConsultationsAction(filters);
      if (res.success) setConsultations(res.consultations);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, [statusFilter]);

  const columns = [
    {
      title: "Tiêu đề hội chẩn",
      key: "title",
      render: (_: any, record: ConsultationView) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.title || "Hội chẩn ca chụp"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{new Date(record.createdAt).toLocaleString()}</Text>
        </Space>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status: string) => {
        let color = "default";
        if (status === "ACTIVE") color = "processing";
        if (status === "REQUESTED") color = "warning";
        if (status === "COMPLETED") color = "success";
        return <Tag color={color}>{statusLabels[status] || status}</Tag>;
      }
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (t: string) => <Text ellipsis style={{ maxWidth: 300 }}>{t || "Không có mô tả"}</Text>
    },
    {
      title: "Người tạo",
      key: "creator",
      render: (_: any, record: ConsultationView) => <Text>{record.createdByUser?.fullName || record.createdByUser?.username || "Unknown"}</Text>
    },
    {
      title: "Tham gia",
      key: "participants",
      render: (_: any, record: ConsultationView) => <Text>{record.participants.length} người</Text>
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: ConsultationView) => (
        <Link href={`/consultations/${record.id}`}>
          <Button type="primary" size="small" icon={<VideoCameraOutlined />}>Vào phòng</Button>
        </Link>
      )
    }
  ];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", height: "100vh" }}>
      <ScreenHeader />
      <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>{consultations.length} cuộc hội chẩn</Text>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "REQUESTED", label: "Đã yêu cầu" },
              { value: "ACTIVE", label: "Đang diễn ra" },
              { value: "COMPLETED", label: "Đã kết thúc" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={loadConsultations} loading={isLoading} />
        </Space>
      </Card>

      <Table
        size="small"
        dataSource={consultations}
        rowKey="id"
        columns={columns}
        loading={isLoading}
        pagination={false}
        scroll={{ y: "calc(100vh - 280px)" }}
        style={{ flex: 1 }}
      />
    </div>
  );
}
