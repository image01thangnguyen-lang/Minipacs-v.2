"use client";

import React, { useMemo, useState } from "react";
import { Table, Tag, Button, Input, Select, Typography, Card, theme } from "antd";
import { PlusOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

const { Text } = Typography;

export function IncidentsAntd({
  incidents,
  isAdmin,
  canReport,
}: {
  incidents: any[];
  isAdmin: boolean;
  canReport: boolean;
}) {
  const { token } = theme.useToken();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredIncidents = useMemo(() => {
    let list = incidents;
    if (statusFilter !== "ALL") {
      list = list.filter(inc => inc.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(inc =>
        `${inc.shortDesc} ${inc.module} ${inc.contextType} ${inc.contextId}`
          .toLowerCase()
          .includes(query)
      );
    }
    return list;
  }, [searchQuery, statusFilter, incidents]);

  const columns = [
    {
      title: "Mô tả",
      dataIndex: "shortDesc",
      key: "shortDesc",
      render: (text: string, record: any) => (
        <div style={{ maxWidth: 300 }}>
          <div style={{ fontWeight: 500, color: token.colorText, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={text}>
            {text}
          </div>
          {record.contextType && (
            <div style={{ fontSize: 12, color: "gray", marginTop: 4 }}>
              Context: {record.contextType} {record.contextId && `(${record.contextId})`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "RESOLVED"
            ? "success"
            : status === "CLOSED"
            ? "default"
            : status === "INVESTIGATING"
            ? "processing"
            : "warning";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      key: "severity",
      render: (sev: string) => {
        const color =
          sev === "SEV1"
            ? "#f5222d"
            : sev === "SEV2"
            ? "#fa541c"
            : sev === "SEV3"
            ? "#faad14"
            : "default";
        return <Tag color={color}>{sev}</Tag>;
      },
    },
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      render: (mod: string) => <Tag>{mod}</Tag>,
    },
    {
      title: "Người báo cáo",
      key: "reportedBy",
      render: (_: any, record: any) => (
        <div>
          <div style={{ color: token.colorText }}>{record.reportedByUser?.fullName || "System"}</div>
          <div style={{ fontSize: 11, color: "gray" }}>
            {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      title: "Tác vụ",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Link href={`/support/incidents/${record.id}`}>
          <Button size="middle" type="link" icon={<EyeOutlined />}>
            Xem chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <ScreenHeader />
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
            Theo dõi sự cố hệ thống. {isAdmin ? "Đang quản lý toàn bộ sự cố." : "Sự cố bạn đã báo cáo."}
          </Text>
        </div>
        {(canReport || isAdmin) && (
          <Link href="/support/incidents/new">
            <Button size="middle" type="primary" icon={<PlusOutlined />}>
              Báo cáo sự cố
            </Button>
          </Link>
        )}
      </div>

      <Card style={{ flex: 1, display: "flex", flexDirection: "column" }} bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--vin-border)", display: "flex", gap: 12 }}>
          <Input
            size="middle"
            prefix={<SearchOutlined style={{ color: "rgba(255,255,255,0.2)" }} />}
            placeholder="Tìm theo mô tả, module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            size="middle"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "OPEN", label: "OPEN" },
              { value: "INVESTIGATING", label: "INVESTIGATING" },
              { value: "RESOLVED", label: "RESOLVED" },
              { value: "CLOSED", label: "CLOSED" },
            ]}
          />
        </div>
        <Table
          size="middle"
          columns={columns}
          dataSource={filteredIncidents}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          scroll={{ y: "calc(100vh - 280px)" }}
        />
      </Card>
    </div>
  );
}
