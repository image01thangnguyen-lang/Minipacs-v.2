"use client";
import React, { useState, useEffect } from "react";
import { Table, Input, Select, Button, Space, Tag, Typography, Card } from "antd";
import { CameraOutlined, ReloadOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { getNonDicomExams } from "./actions";

const { Text } = Typography;

export function NonDicomAntd() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await getNonDicomExams({ status: statusFilter, search });
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [statusFilter]);

  const columns = [
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (status: string) => {
        let color = "default";
        if (status === "REQUESTED") color = "warning";
        if (status === "CAPTURING") color = "processing";
        if (status === "COMPLETED") color = "success";
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: "Case Code / Bệnh nhân",
      key: "patientInfo",
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.patientName || "Không tên"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.patientId} • {record.caseCode}</Text>
        </Space>
      )
    },
    {
      title: "Giới tính / NS",
      key: "demographics",
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{record.patientSex === 'M' ? 'Nam' : record.patientSex === 'F' ? 'Nữ' : 'Khác'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.patientBirthDate ? new Date(record.patientBirthDate).getFullYear() : '-'}</Text>
        </Space>
      )
    },
    {
      title: "Chỉ định",
      dataIndex: "indication",
      render: (t: string) => <Text>{t || "-"}</Text>
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (t: string) => <Text>{new Date(t).toLocaleString()}</Text>
    },
    {
      title: "Media",
      key: "mediaCount",
      render: (_: any, record: any) => <Text>{record._count?.media || 0} files</Text>
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Link href={`/non-dicom/${record.id}`}>
          <Button type="primary" size="middle" icon={<CameraOutlined />}>Capture</Button>
        </Link>
      )
    }
  ];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", height: "100vh" }}>
      <ScreenHeader />
      <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>Quản lý các ca siêu âm, nội soi, chụp ảnh ngoài DICOM</Text>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            size="middle"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 220 }}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "REQUESTED", label: "Chờ thực hiện (REQUESTED)" },
              { value: "CAPTURING", label: "Đang chụp (CAPTURING)" },
              { value: "COMPLETED", label: "Hoàn tất (COMPLETED)" },
            ]}
          />
          <Input.Search
            size="middle"
            placeholder="Tìm tên, mã BN..."
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={loadExams}
            style={{ width: 250 }}
          />
          <Button size="middle" icon={<ReloadOutlined />} onClick={loadExams} loading={loading} />
        </Space>
      </Card>

      <Table
        size="middle"
        dataSource={exams}
        rowKey="id"
        columns={columns}
        loading={loading}
        pagination={false}
        scroll={{ y: "calc(100vh - 280px)" }}
        style={{ flex: 1 }}
      />
    </div>
  );
}
