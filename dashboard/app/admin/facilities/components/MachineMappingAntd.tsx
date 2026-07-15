"use client";

import { useEffect, useState, useMemo } from "react";
import { LinkOutlined, DisconnectOutlined } from "@ant-design/icons";
import { Table, Select, Button, Checkbox, Typography, Spin, Alert, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getOrganizationTreeAction,
  getDicomNodesMappingAction,
  assignDicomNodeAction,
  reactivateDicomNodeAction
} from "../actions";

const { Text } = Typography;

type MappingNode = {
  id: string;
  name: string;
  isActive: boolean;
  modality: string;
  aeTitle: string | null;
  facilityId: string | null;
};

type FacilityOption = { id: string; name: string; code: string };

export function MachineMappingAntd() {
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [nodes, setNodes] = useState<MappingNode[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [fData, nData] = await Promise.all([
        getOrganizationTreeAction(),
        getDicomNodesMappingAction(includeInactive)
      ]);
      setFacilities(fData);
      setNodes(nData);
    } catch (error) {
      console.error(error);
      setError("Không thể tải dữ liệu gắn kết máy chụp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [includeInactive]);

  const handleAssign = async (nodeId: string, facilityId: string | null) => {
    setSaving(nodeId);
    setError("");
    try {
      const res = await assignDicomNodeAction(nodeId, facilityId);
      if (res.success) {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, facilityId } : n));
      } else {
        setError(res.error || "Không thể cập nhật đơn vị tổ chức.");
      }
    } catch {
      setError("Không thể cập nhật đơn vị tổ chức. Vui lòng thử lại.");
    } finally {
      setSaving(null);
    }
  };

  const handleReactivate = async (nodeId: string) => {
    setSaving(nodeId);
    setError("");
    try {
      const res = await reactivateDicomNodeAction(nodeId);
      if (res.success) {
        setNodes(current => current.map(n => n.id === nodeId ? { ...n, isActive: true } : n));
      } else {
        setError(res.error || "Không thể khôi phục máy chụp.");
      }
    } catch {
      setError("Không thể khôi phục máy chụp. Vui lòng thử lại.");
    } finally {
      setSaving(null);
    }
  };

  const facilityOptions = useMemo(() => {
    return facilities.map(f => ({
      value: f.id,
      label: `${f.name} (${f.code})`
    }));
  }, [facilities]);

  const columns: ColumnsType<MappingNode> = [
    {
      title: "Máy chụp (DICOM Node)",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text, record) => (
        <div>
          <Text strong style={{ color: "white" }}>{text}</Text>
          {!record.isActive && <Tag color="error" className="ml-2">Ngừng hoạt động</Tag>}
        </div>
      )
    },
    {
      title: "Modality / AE Title",
      key: "modalityAndAeTitle",
      width: 250,
      render: (_, record) => (
        <Text type="secondary" style={{ fontFamily: "monospace", fontSize: "11px" }}>
          {record.modality} / {record.aeTitle || <Text type="secondary" italic>Chưa cấu hình</Text>}
        </Text>
      )
    },
    {
      title: "Đơn vị tổ chức",
      key: "facility",
      width: 350,
      render: (_, record) => (
        <Select
          style={{ width: "100%" }}
          size="middle"
          placeholder="-- Chưa gắn vào đơn vị nào --"
          value={record.facilityId || undefined}
          onChange={(val) => handleAssign(record.id, val || null)}
          disabled={saving === record.id || !record.isActive}
          loading={saving === record.id}
          options={facilityOptions}
          allowClear
          onClear={() => handleAssign(record.id, null)}
        />
      )
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => {
        if (saving === record.id) return <Spin />;
        if (!record.isActive) {
          return (
            <Button
              type="link"
              size="middle"
              onClick={() => handleReactivate(record.id)}
              style={{ color: "#52c41a", fontSize: "10px", padding: 0 }}
            >
              Khôi phục
            </Button>
          );
        }
        if (record.facilityId) {
          return (
            <Tooltip title="Gỡ gắn kết">
              <Button
                type="text"
                size="middle"
                danger
                icon={<DisconnectOutlined />}
                onClick={() => handleAssign(record.id, null)}
              />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="Chưa gắn kết">
            <Button type="text" size="middle" disabled icon={<LinkOutlined />} />
          </Tooltip>
        );
      }
    }
  ];

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><Spin /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Checkbox
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
        >
          Hiển thị máy chụp đã ngừng hoạt động
        </Checkbox>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-4" />}

      <Table
        size="middle"
        dataSource={nodes}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ y: "calc(100vh - 300px)" }}
      />
    </div>
  );
}
