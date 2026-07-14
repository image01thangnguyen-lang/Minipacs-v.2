"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Typography, DatePicker, Button, Table, Space, Tag, Tabs, Badge } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { getStatisticsDashboardAction } from "./actions";
import type { StatisticsPayload } from "./types";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export function StatisticsAntd() {
  const [filters, setFilters] = useState<any>({
    dateFrom: dayjs().format("YYYY-MM-DD"),
    dateTo: dayjs().format("YYYY-MM-DD"),
  });
  const [data, setData] = useState<StatisticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (nextFilters = filters) => {
    setIsLoading(true);
    try {
      const result = await getStatisticsDashboardAction(nextFilters);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ScreenHeader />
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap align="end">
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>Ngày thống kê</Text>
            <DatePicker.RangePicker
              size="small"
              value={[dayjs(filters.dateFrom), dayjs(filters.dateTo)]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({ ...filters, dateFrom: dates[0].format("YYYY-MM-DD"), dateTo: dates[1].format("YYYY-MM-DD") });
                }
              }}
            />
          </Space>
          <Button type="primary" size="small" onClick={() => loadData(filters)} loading={isLoading}>
            Cập nhật
          </Button>
        </Space>
      </Card>

      {isLoading && !data ? (
        <div style={{ textAlign: "center", padding: 40 }}><Text type="secondary">Đang tải...</Text></div>
      ) : data ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card size="small" style={{ background: "var(--vin-shell)" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Ca trong kỳ</Text>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>{data.kpis.studiesInPeriod}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: "var(--vin-shell)" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Đã ký</Text>
                <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>{data.kpis.finalizedInPeriod}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: "var(--vin-shell)" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Chờ đọc</Text>
                <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>{data.kpis.readyToRead}</div>
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small" style={{ background: "var(--vin-shell)" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>QC Issues</Text>
                <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>{data.kpis.qcIssues}</div>
              </Card>
            </Col>
          </Row>
          
          <Card size="small" title="Số ca theo bác sĩ" style={{ marginBottom: 24 }}>
            <Table
              size="small"
              dataSource={data.doctorRows}
              rowKey="doctorId"
              pagination={false}
              columns={[
                { title: "Bác sĩ", dataIndex: "doctorName" },
                { title: "Trong kỳ", dataIndex: "finalInPeriod" },
                { title: "Tháng này", dataIndex: "finalThisMonth" },
                { title: "Nháp", dataIndex: "draftCount" },
              ]}
            />
          </Card>
          
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" title="PACS Storage">
                <Table
                  size="small"
                  dataSource={[
                    { key: "1", label: "Patients", value: data.storage.patients },
                    { key: "2", label: "Studies", value: data.storage.studies },
                    { key: "3", label: "Disk", value: `${data.storage.diskSizeMb} MB` },
                  ]}
                  showHeader={false}
                  pagination={false}
                  columns={[
                    { dataIndex: "label", render: (t) => <Text type="secondary">{t}</Text> },
                    { dataIndex: "value", render: (t) => <Text strong>{t}</Text> },
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Outliers SLA">
                <Table
                  size="small"
                  dataSource={data.performance.outliers}
                  rowKey="studyInstanceUid"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: "Bệnh nhân", dataIndex: "patientName" },
                    { title: "Chặng", dataIndex: "stage" },
                    { title: "Duration", dataIndex: "durationMinutes", render: (val) => <Text type="danger">{Math.round(val)}p</Text> },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
}
