"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Table, Tabs, Card, Select, Button, Tag, Space, Typography, Badge, Alert, Row, Col } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { useCommandCenterPolling } from "./useCommandCenterPolling";
import {
  fetchCommandCenterSummary,
  fetchLiveQueue,
  fetchDoctorMachineBacklog,
  fetchActiveAlerts,
  fetchSlaBreaches,
  fetchStuckWorkflow
} from "./actions";

const { Text } = Typography;

export function CommandCenterAntd() {
  const [filters, setFilters] = useState<any>({});
  const [filterDraft, setFilterDraft] = useState<any>({});
  const [activeTab, setActiveTab] = useState("queue");

  const handleApplyFilters = () => setFilters(filterDraft);

  const [queuePage, setQueuePage] = useState(1);
  const [slaPage, setSlaPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [stuckPage, setStuckPage] = useState(1);
  const [slaPrimed, setSlaPrimed] = useState(false);

  useEffect(() => {
    setQueuePage(1);
    setSlaPage(1);
    setAlertsPage(1);
    setStuckPage(1);
    setSlaPrimed(false);
  }, [filters]);

  const fetchSummary = useCallback(() => fetchCommandCenterSummary(filters), [filters]);
  const fetchQueue = useCallback(() => fetchLiveQueue(filters, { page: queuePage, pageSize: 50 }), [filters, queuePage]);
  const fetchAlerts = useCallback(() => fetchActiveAlerts(filters, { page: alertsPage, pageSize: 50 }), [filters, alertsPage]);
  const fetchBreaches = useCallback(() => fetchSlaBreaches(filters, { page: slaPage, pageSize: 50 }), [filters, slaPage]);
  const fetchBacklog = useCallback(() => fetchDoctorMachineBacklog(filters), [filters]);
  const fetchStuck = useCallback(() => fetchStuckWorkflow(filters, { page: stuckPage, pageSize: 50 }), [filters, stuckPage]);
  const handleSlaSuccess = useCallback(() => setSlaPrimed(true), []);

  const { data: summary, isLoading: isLoadingSummary } = useCommandCenterPolling({
    fetchFn: fetchSummary,
    intervalMs: 60000,
  });
  const { data: queue, isLoading: isLoadingQueue } = useCommandCenterPolling({
    fetchFn: fetchQueue,
    enabled: activeTab === "queue"
  });
  const { data: alerts, isLoading: isLoadingAlerts } = useCommandCenterPolling({
    fetchFn: fetchAlerts,
    enabled: activeTab === "alerts"
  });
  const { data: breaches, isLoading: isLoadingBreaches } = useCommandCenterPolling({
    fetchFn: fetchBreaches,
    enabled: activeTab === "sla" || !slaPrimed,
    intervalMs: 60000,
    onSuccess: handleSlaSuccess,
  });
  const { data: backlog, isLoading: isLoadingBacklog } = useCommandCenterPolling({
    fetchFn: fetchBacklog,
    enabled: activeTab === "backlog"
  });
  const { data: stuck, isLoading: isLoadingStuck } = useCommandCenterPolling({
    fetchFn: fetchStuck,
    enabled: activeTab === "stuck"
  });

  const getPriorityColor = (priority: string) => {
    if (priority === "STAT") return "error";
    if (priority === "URGENT") return "warning";
    return "default";
  };

  const queueColumns = [
    {
      title: "Mã ca",
      dataIndex: "accessionNumber",
      render: (text: string, record: any) => {
        const href = record.source === "HIS" ? `/worklist?orderId=${record.orderId || record.id}` : `/report/${record.uid}`;
        return <Link href={href} className="text-vin-accent hover:underline">{text}</Link>;
      }
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      render: (text: string) => <Tag color={text === 'HIS' ? "purple" : "cyan"}>{text}</Tag>
    },
    {
      title: "Bệnh nhân",
      dataIndex: "patientName",
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      render: (text: string) => <Tag color={getPriorityColor(text)}>{text}</Tag>
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
    },
  ];

  const slaColumns = [
    {
      title: "Bệnh nhân",
      dataIndex: "patientName",
      render: (text: string, record: any) => (
        record.studyInstanceUid ? (
          <Link href={`/report/${record.studyInstanceUid}`} className="text-vin-accent hover:underline">{text}</Link>
        ) : text
      )
    },
    { title: "Chặng (Stage)", dataIndex: "stage" },
    {
      title: "Thời gian",
      dataIndex: "durationMinutes",
      render: (val: number) => <Text type="danger" strong>{Math.round(val)} phút</Text>
    },
    { title: "Ngưỡng (phút)", dataIndex: "thresholdMinutes" },
    {
      title: "Policy",
      dataIndex: "policyCode",
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text>{text}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>({record.source})</Text>
        </Space>
      )
    }
  ];

  const stuckColumns = [
    {
      title: "Mã ca",
      dataIndex: "accessionNumber",
      render: (text: string, record: any) => (
        record.studyInstanceUid ? (
          <Link href={`/report/${record.studyInstanceUid}`} className="text-vin-accent hover:underline">{text}</Link>
        ) : <Text>{text}</Text>
      )
    },
    { title: "Bệnh nhân", dataIndex: "patientName", render: (t: string) => <Text strong>{t}</Text> },
    { title: "Trạng thái", dataIndex: "status" },
    {
      title: "Bị kẹt từ",
      dataIndex: "stuckSince",
      render: (val: string) => new Date(val).toLocaleString()
    },
    {
      title: "Thời gian kẹt",
      dataIndex: "hoursStuck",
      render: (val: number) => <Text style={{ color: "#fa8c16" }} strong>{val}h</Text>
    }
  ];

  const alertColumns = [
    {
      title: "Cảnh báo",
      key: "title",
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.message}</Text>
        </Space>
      )
    },
    {
      title: "Độ nghiêm trọng",
      dataIndex: "severity",
      render: (text: string) => <Tag color={text === 'CRITICAL' ? 'error' : 'warning'}>{text}</Tag>
    },
    { title: "Loại đối tượng", dataIndex: "entityType", render: (t: string) => <Text type="secondary">{t || "SYSTEM"}</Text> },
    { title: "Thời gian", dataIndex: "createdAt", render: (t: string) => <Text type="secondary">{new Date(t).toLocaleString()}</Text> }
  ];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ScreenHeader />
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap align="end">
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>Modality</Text>
            <Select
              style={{ width: 120 }}
              size="small"
              allowClear
              placeholder="Tất cả"
              value={filterDraft.modality}
              onChange={val => setFilterDraft({ ...filterDraft, modality: val })}
              options={[
                { label: "CR", value: "CR" },
                { label: "DX", value: "DX" },
                { label: "CT", value: "CT" },
                { label: "MR", value: "MR" },
                { label: "US", value: "US" },
              ]}
            />
          </Space>
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>Độ ưu tiên</Text>
            <Select
              style={{ width: 120 }}
              size="small"
              allowClear
              placeholder="Tất cả"
              value={filterDraft.priority}
              onChange={val => setFilterDraft({ ...filterDraft, priority: val })}
              options={[
                { label: "STAT", value: "STAT" },
                { label: "URGENT", value: "URGENT" },
                { label: "ROUTINE", value: "ROUTINE" },
              ]}
            />
          </Space>
          <Button type="primary" size="small" onClick={handleApplyFilters}>Áp dụng</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small" style={{ background: "var(--vin-shell)" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Chờ chụp</Text>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>{summary?.WAITING_SCAN || 0}</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: "var(--vin-shell)" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Chờ đọc</Text>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>{summary?.WAITING_READ || 0}</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: "rgba(255, 77, 79, 0.1)", borderColor: "#ff4d4f" }}>
            <Text type="danger" style={{ fontSize: 12 }}>Quá hạn SLA</Text>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>{slaPrimed && breaches ? breaches.total : "--"}</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: "rgba(250, 173, 20, 0.1)", borderColor: "#faad14" }}>
            <Text type="warning" style={{ fontSize: 12 }}>Lỗi HIS</Text>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>{summary?.HIS_FAILED || 0}</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: "rgba(250, 173, 20, 0.1)", borderColor: "#faad14" }}>
            <Text type="warning" style={{ fontSize: 12 }}>Alerts Open</Text>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>{summary?.ACTIVE_ALERTS || 0}</div>
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ flex: 1 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: "0 16px" }}
          items={[
            {
              key: "queue",
              label: "Live Queue",
              children: (
                <Table
                  size="small"
                  dataSource={queue?.data || []}
                  columns={queueColumns}
                  rowKey="id"
                  loading={isLoadingQueue}
                  pagination={{
                    current: queuePage,
                    pageSize: 50,
                    total: queue?.total || 0,
                    onChange: (page) => setQueuePage(page),
                    showSizeChanger: false,
                  }}
                  scroll={{ y: "calc(100vh - 400px)" }}
                />
              )
            },
            {
              key: "sla",
              label: "SLA Breaches",
              children: (
                <Table
                  size="small"
                  dataSource={breaches?.data || []}
                  columns={slaColumns}
                  rowKey={(r) => r.id || `${r.studyInstanceUid || "unknown"}:${r.stage}:${r.policyCode}`}
                  loading={isLoadingBreaches}
                  pagination={{
                    current: slaPage,
                    pageSize: 50,
                    total: breaches?.total || 0,
                    onChange: (page) => setSlaPage(page),
                    showSizeChanger: false,
                  }}
                  scroll={{ y: "calc(100vh - 400px)" }}
                />
              )
            },
            {
              key: "stuck",
              label: "Stuck Workflow",
              children: (
                <Table
                  size="small"
                  dataSource={stuck?.data || []}
                  columns={stuckColumns}
                  rowKey="id"
                  loading={isLoadingStuck}
                  pagination={{
                    current: stuckPage,
                    pageSize: 50,
                    total: stuck?.total || 0,
                    onChange: (page) => setStuckPage(page),
                    showSizeChanger: false,
                  }}
                  scroll={{ y: "calc(100vh - 400px)" }}
                />
              )
            },
            {
              key: "backlog",
              label: "Workload",
              children: (
                <Row gutter={32} style={{ padding: 16 }}>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 16, marginBottom: 16, display: "block" }}>Bác sĩ (Chờ đọc/Đang đọc)</Text>
                    {isLoadingBacklog ? <div>Đang tải...</div> : (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {backlog?.doctorBacklog?.map((d: any, idx: number) => (
                          <Card size="small" key={idx} bodyStyle={{ padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                            <Text strong>{d.doctorName}</Text>
                            <Badge count={d.count} color="cyan" />
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 16, marginBottom: 16, display: "block" }}>Máy chụp (Chờ chụp)</Text>
                    {isLoadingBacklog ? <div>Đang tải...</div> : (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {backlog?.machineBacklog?.map((m: any, idx: number) => (
                          <Card size="small" key={idx} bodyStyle={{ padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                            <Text strong>{m.machineName}</Text>
                            <Badge count={m.count} color="orange" />
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Col>
                </Row>
              )
            },
            {
              key: "alerts",
              label: "Active Alerts",
              children: (
                <div style={{ padding: "0 0" }}>
                  {alerts?.truncated && (
                    <Alert style={{ margin: "16px 16px 0" }} message="Có hơn 1000 Alerts đang chờ xử lý. Vui lòng sử dụng bộ lọc để thu hẹp phạm vi." type="warning" showIcon />
                  )}
                  <Table
                    size="small"
                    dataSource={alerts?.data || []}
                    columns={alertColumns}
                    rowKey="id"
                    loading={isLoadingAlerts}
                    pagination={{
                      current: alertsPage,
                      pageSize: 50,
                      total: alerts?.total || 0,
                      onChange: (page) => setAlertsPage(page),
                      showSizeChanger: false,
                    }}
                    scroll={{ y: "calc(100vh - 400px)" }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
