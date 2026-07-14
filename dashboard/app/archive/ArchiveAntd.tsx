"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Table, Input, Select, Button, Space, Tag, Typography, Card, Descriptions, Divider, Alert, Row, Col, Spin } from "antd";
import { SearchOutlined, ReloadOutlined, PrinterOutlined, FilePdfOutlined, LinkOutlined, TeamOutlined, SyncOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { PrintTemplateViewer } from "@/app/report/[studyInstanceUid]/components/PrintTemplateViewer";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ConsultationDialog } from "@/components/consultation/ConsultationDialog";
import { formatDate, formatDateTime, reportStatusLabels, statusClass, studyStatusLabels } from "./utils";
import { getUserPermissionsAction } from "../actions";
import {
  getArchiveDoctorsAction,
  getArchiveReportAction,
  logArchivePrintAction,
  markArchiveDeliveredAction,
  searchArchiveStudiesAction,
} from "./actions";
import { sendReportToHisAction } from "../his/actions";
import type { ArchiveDoctorOption, ArchiveReportDetail, ArchiveSearchFilters, ArchiveStudyRow } from "./types";

const { Text } = Typography;

const modalityOptions = [
  { value: "ALL", label: "Modality" },
  { value: "DX", label: "DX" },
  { value: "CR", label: "CR" },
  { value: "US", label: "US" },
  { value: "CT", label: "CT" },
  { value: "MR", label: "MR" },
  { value: "MG", label: "MG" },
];

const statusOptions = [
  { value: "ALL", label: "Tất cả" },
  { value: "REPORT_FINAL", label: "Report final" },
  { value: "FINALIZED", label: "Đã ký" },
  { value: "DELIVERED", label: "Đã trả" },
  { value: "ARCHIVED", label: "Lưu trữ" },
  { value: "DELETED_FROM_PACS", label: "Đã xóa ảnh" },
];

function normalizeFilterValue(value?: string) {
  return value === "ALL" ? "" : value || "";
}

export function ArchiveAntd() {
  const [filters, setFilters] = useState<ArchiveSearchFilters>({
    patientName: "",
    patientId: "",
    accessionNumber: "",
    dateFrom: "",
    dateTo: "",
    modality: "ALL",
    doctorId: "ALL",
    status: "ALL",
  });
  const [rows, setRows] = useState<ArchiveStudyRow[]>([]);
  const [doctors, setDoctors] = useState<ArchiveDoctorOption[]>([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [detail, setDetail] = useState<ArchiveReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [consultDialogOpen, setConsultDialogOpen] = useState(false);

  useEffect(() => {
    getUserPermissionsAction().catch(console.error);
  }, []);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: detail ? `Ket_Qua_CDHA_${detail.patientId}_${detail.accessionNumber}` : "Ket_Qua_CDHA",
  });

  const runSearch = async (nextFilters = filters, keepSelection = false) => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const normalized = {
        ...nextFilters,
        modality: normalizeFilterValue(nextFilters.modality),
        doctorId: normalizeFilterValue(nextFilters.doctorId),
        status: nextFilters.status || "ALL",
      };
      const [resultRows, doctorOptions] = await Promise.all([
        searchArchiveStudiesAction(normalized),
        doctors.length ? Promise.resolve(doctors) : getArchiveDoctorsAction(),
      ]);
      setRows(resultRows);
      setDoctors(doctorOptions);
      if (!keepSelection) {
        setSelectedUid("");
        setDetail(null);
      }
    } catch (err: any) {
      setError(err?.message || "Không tải được danh sách archive.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { runSearch(); }, []);

  const loadDetail = async (studyInstanceUid: string) => {
    setSelectedUid(studyInstanceUid);
    setIsDetailLoading(true);
    setError("");
    try {
      const res = await getArchiveReportAction(studyInstanceUid);
      if (res.success && res.detail) setDetail(res.detail);
      else { setDetail(null); setError(res.error || "Không tải được báo cáo."); }
    } catch (err: any) {
      setDetail(null);
      setError(err?.message || "Không tải được báo cáo.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const runPrintAction = async (mode: "PRINT" | "PDF") => {
    if (!detail) return;
    setIsActionBusy(true);
    try {
      await logArchivePrintAction(detail.studyInstanceUid, mode);
      setMessage(mode === "PDF" ? "Đã ghi log xuất PDF." : "Đã ghi log in lại.");
      handlePrint();
    } catch (err: any) {
      setError(err?.message || "Không thực hiện được thao tác in.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const markDelivered = async () => {
    if (!detail) return;
    setIsActionBusy(true);
    try {
      const res = await markArchiveDeliveredAction(detail.studyInstanceUid);
      if (res.success) {
        await Promise.all([loadDetail(detail.studyInstanceUid), runSearch(filters, true)]);
        setMessage("Đã ghi nhận trả kết quả.");
      } else {
        setError(res.error || "Không ghi nhận được.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const runHisRetry = async () => {
    if (!detail) return;
    setIsActionBusy(true);
    try {
      const res = await sendReportToHisAction(detail.studyInstanceUid);
      if (res.success) setMessage("Đã gửi kết quả sang HIS!");
      else setError(res.error || "Lỗi gửi HIS.");
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối HIS.");
    } finally {
      setIsActionBusy(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "DELIVERED" || status === "FINALIZED") return "success";
    if (status === "ARCHIVED") return "processing";
    if (status === "DELETED_FROM_PACS") return "error";
    return "default";
  };

  const columns = [
    {
      title: "Bệnh nhân",
      key: "patient",
      width: 200,
      render: (_: any, row: ArchiveStudyRow) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.patientName}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>PID: {row.patientId}</Text>
        </Space>
      ),
    },
    {
      title: "Ca chụp",
      key: "study",
      width: 220,
      render: (_: any, row: ArchiveStudyRow) => (
        <Space direction="vertical" size={0}>
          <Text ellipsis style={{ maxWidth: 200 }}>{row.procedureName || row.studyDescription}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>{row.accessionNumber}</Text>
        </Space>
      ),
    },
    {
      title: "Mod",
      dataIndex: "modality",
      width: 60,
      render: (text: string) => <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 11 }}>{text}</Tag>,
    },
    {
      title: "Bác sĩ",
      key: "doctor",
      width: 140,
      render: (_: any, row: ArchiveStudyRow) => (
        <Space direction="vertical" size={0}>
          <Text>{row.assignedDoctorName || "Chưa gán"}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{reportStatusLabels[row.reportStatus] || row.reportStatus}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "studyStatus",
      width: 110,
      render: (text: string) => <Tag color={getStatusColor(text)}>{studyStatusLabels[text] || text}</Tag>,
    },
    {
      title: "Ngày",
      dataIndex: "studyDate",
      width: 100,
      render: (text: string) => <Text type="secondary">{formatDate(text)}</Text>,
    },
  ];

  const printContext = detail
    ? {
        patientName: detail.patientName,
        patientId: detail.patientId,
        studyDate: formatDate(detail.studyDate || detail.finalizedAt),
        studyDesc: detail.studyDescription,
        reportContent: detail.findings,
        conclusion: detail.conclusion,
        recommendation: detail.recommendation,
        ...detail.clinicProfile,
        ...detail.doctorPrintInfo,
      }
    : { patientName: "", patientId: "", studyDate: "", studyDesc: "", reportContent: "", conclusion: "", recommendation: "" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 0 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--vin-border-subtle, #303030)" }}>
        <ScreenHeader />
        <Text type="secondary" style={{ fontSize: 12 }}>{rows.length} ca trong danh sách</Text>

        {(message || error) && (
          <Alert
            style={{ marginTop: 8 }}
            type={error ? "error" : "success"}
            message={error || message}
            showIcon
            closable
            onClose={() => { setError(""); setMessage(""); }}
          />
        )}

        <Card size="small" style={{ marginTop: 12 }} bodyStyle={{ padding: 8 }}>
          <Space wrap size={4}>
            <Input size="small" placeholder="Tên BN" style={{ width: 130 }} value={filters.patientName} onChange={e => setFilters(f => ({ ...f, patientName: e.target.value }))} />
            <Input size="small" placeholder="PID" style={{ width: 100, fontFamily: "monospace" }} value={filters.patientId} onChange={e => setFilters(f => ({ ...f, patientId: e.target.value }))} />
            <Input size="small" placeholder="Accession" style={{ width: 130, fontFamily: "monospace" }} value={filters.accessionNumber} onChange={e => setFilters(f => ({ ...f, accessionNumber: e.target.value }))} />
            <Select size="small" style={{ width: 100 }} value={filters.modality} onChange={val => setFilters(f => ({ ...f, modality: val }))} options={modalityOptions} />
            <Select size="small" style={{ width: 150 }} value={filters.doctorId} onChange={val => setFilters(f => ({ ...f, doctorId: val }))} options={[{ value: "ALL", label: "Bác sĩ" }, ...doctors.map(d => ({ value: d.id, label: d.name }))]} />
            <Select size="small" style={{ width: 130 }} value={filters.status} onChange={val => setFilters(f => ({ ...f, status: val }))} options={statusOptions} />
            <Button size="small" type="primary" icon={<SearchOutlined />} onClick={() => runSearch(filters)} loading={isLoading}>Tìm</Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => runSearch(filters, true)} loading={isLoading} />
          </Space>
        </Card>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(680px, 1fr) 420px", overflow: "hidden" }}>
        <div style={{ overflow: "auto" }}>
          <Table
            size="small"
            dataSource={rows}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            scroll={{ y: "calc(100vh - 260px)" }}
            onRow={(record) => ({
              onClick: () => loadDetail(record.studyInstanceUid),
              style: { cursor: "pointer", background: selectedUid === record.studyInstanceUid ? "rgba(19, 194, 194, 0.15)" : undefined },
            })}
          />
        </div>

        <div style={{ overflow: "auto", padding: 16, borderLeft: "1px solid var(--vin-border-subtle, #303030)" }}>
          {isDetailLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Spin /></div>
          ) : !detail ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--vin-text-faint)" }}>
              <Text type="secondary">Chọn một ca trong danh sách</Text>
            </div>
          ) : (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{detail.patientName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>{detail.patientId}</Text>
                  </div>
                  <Tag color={getStatusColor(detail.studyStatus)}>{studyStatusLabels[detail.studyStatus] || detail.studyStatus}</Tag>
                </Space>
              </div>

              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Ngày chụp">{formatDateTime(detail.studyDate)}</Descriptions.Item>
                <Descriptions.Item label="Accession"><Text code>{detail.accessionNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Modality"><Tag color="cyan">{detail.modality}</Tag></Descriptions.Item>
                <Descriptions.Item label="BS đọc">{detail.doctorName}</Descriptions.Item>
                <Descriptions.Item label="Procedure" span={2}>{detail.procedureName || detail.studyDescription}</Descriptions.Item>
              </Descriptions>

              <Space wrap size={4}>
                <Link href={`/report/${encodeURIComponent(detail.studyInstanceUid)}`}>
                  <Button size="small">Mở report</Button>
                </Link>
                <Button size="small" icon={<PrinterOutlined />} onClick={() => runPrintAction("PRINT")} disabled={isActionBusy}>In lại</Button>
                <Button size="small" icon={<FilePdfOutlined />} onClick={() => runPrintAction("PDF")} disabled={isActionBusy}>PDF</Button>
                {detail.allowedActions?.share && (
                  <Button size="small" icon={<LinkOutlined />} onClick={() => setShareDialogOpen(true)}>Chia sẻ</Button>
                )}
                {detail.allowedActions?.createConsultation && (
                  <Button size="small" icon={<TeamOutlined />} onClick={() => setConsultDialogOpen(true)}>Hội chẩn</Button>
                )}
                {detail.allowedActions?.syncHis && detail.canSyncHisMatrix && (
                  <Button size="small" icon={<SyncOutlined />} onClick={runHisRetry} disabled={isActionBusy} danger={detail.hisResultStatus === "FAILED"}>
                    {detail.hisResultStatus === "FAILED" ? "Retry HIS" : "Gửi HIS"}
                  </Button>
                )}
              </Space>

              {detail.studyStatus === "FINALIZED" && (
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={markDelivered} disabled={isActionBusy} block style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                  Ghi nhận đã trả kết quả
                </Button>
              )}

              <Card size="small" title="Kết luận">
                <Text>{detail.conclusion || "-"}</Text>
              </Card>
              <Card size="small" title="Mô tả">
                <div dangerouslySetInnerHTML={{ __html: detail.findings || "<span>-</span>" }} style={{ fontSize: 12 }} />
              </Card>
            </Space>
          )}
        </div>
      </div>

      <PrintTemplateViewer ref={printRef} templateHtml={detail?.templateHtml || ""} context={printContext} />
      <ShareDialog isOpen={shareDialogOpen} onClose={() => setShareDialogOpen(false)} scope="STUDY" resourceId={detail?.studyInstanceUid || ""} />
      <ConsultationDialog isOpen={consultDialogOpen} onClose={() => setConsultDialogOpen(false)} sourceType="ARCHIVE" studyInstanceUid={detail?.studyInstanceUid || ""} />
    </div>
  );
}
