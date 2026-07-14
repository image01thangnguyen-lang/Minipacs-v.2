"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table, Input, Select, Button, Space, Tag, Typography, DatePicker,
  Dropdown, Alert, Tooltip
} from "antd";
import {
  SearchOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileAddOutlined, SyncOutlined, CameraOutlined, PlayCircleOutlined,
  EditOutlined, EyeOutlined, MoreOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { ClinicalInfoModal } from "@/app/components/ClinicalInfoModal";
import {
  cancelWorklistOrderAction,
  checkInWorklistOrderAction,
  createWorklistAction,
  getWorklistOrdersAction,
  regenerateWorklistFileAction,
  startReadingAction,
  checkCanReadStudiesAction,
  checkCanUpdateClinicalAction,
  getTechnologistsAction,
  createNonDicomExamFromWorklistAction
} from "./actions";
import { updateOrderFromHisAction } from "../his/actions";
import { updateClinicalInfoAction, addIndicationAction } from "@/app/actions";
import type { WorklistOrderView } from "./utils";

const { Text } = Typography;

const orderStatusLabels: Record<string, string> = {
  REQUESTED: "Mới tạo",
  SCHEDULED: "Đã hẹn",
  ARRIVED: "Đã đến",
  CANCELLED: "Đã hủy",
  EXPIRED: "Quá hạn",
};

const studyStatusLabels: Record<string, string> = {
  ORDERED: "Chờ chụp",
  READY_FOR_SCAN: "Sẵn sàng chụp",
  RECEIVED: "Đã nhận ảnh",
  STABLE: "Ảnh ổn định",
  READY_TO_READ: "Chờ đọc",
  READING: "Đang đọc",
  FINALIZED: "Đã ký",
  DELIVERED: "Đã trả",
  ERROR: "Lỗi",
};

function toDateInputValue(date = new Date()) {
  return dayjs(date).format("YYYY-MM-DD");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function getOrderStatusColor(status: string) {
  if (status === "ARRIVED") return "success";
  if (status === "SCHEDULED") return "processing";
  if (status === "CANCELLED" || status === "EXPIRED") return "error";
  return "default";
}

function getStudyStatusColor(status: string) {
  if (status === "FINALIZED" || status === "DELIVERED") return "success";
  if (status === "READY_TO_READ" || status === "READING") return "processing";
  if (status === "ERROR") return "error";
  return "default";
}

function getPriorityColor(priority: string) {
  if (priority === "STAT") return "error";
  if (priority === "URGENT") return "warning";
  return "default";
}

export function WorklistAntd(props: { searchParams?: { orderId?: string } }) {
  const [orders, setOrders] = useState<WorklistOrderView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(props.searchParams?.orderId || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canReadStudies, setCanReadStudies] = useState(false);
  const [canUpdateClinical, setCanUpdateClinical] = useState(false);
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false);
  const [clinicalModalMode, setClinicalModalMode] = useState<"CLINICAL_INFO" | "INDICATION">("CLINICAL_INFO");
  const [activeOrder, setActiveOrder] = useState<WorklistOrderView | null>(null);
  const [canSyncHis, setCanSyncHis] = useState(false);
  const [technologists, setTechnologists] = useState<{ id: string; name: string }[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getWorklistOrdersAction({
        date: selectedDate,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery,
      });
      setOrders(data || []);
    } catch (err: any) {
      setError(err?.message || "Không tải được danh sách order.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, statusFilter, searchQuery]);

  useEffect(() => {
    checkCanReadStudiesAction().then(setCanReadStudies).catch(console.error);
    checkCanUpdateClinicalAction().then((canUpdate) => {
      setCanUpdateClinical(canUpdate);
      if (canUpdate) {
        getTechnologistsAction().then(setTechnologists).catch(console.error);
      }
    }).catch(console.error);
    import("../actions").then(m => m.getUserPermissionsAction()).then(res => {
      setCanSyncHis(res.permissions.includes("his.sync"));
    }).catch(console.error);
  }, []);

  useEffect(() => { loadOrders(); }, [selectedDate, statusFilter]);

  const runOrderAction = async (orderId: string, action: "checkin" | "cancel" | "regen") => {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");
    try {
      const res =
        action === "checkin" ? await checkInWorklistOrderAction(orderId)
        : action === "cancel" ? await cancelWorklistOrderAction(orderId)
        : await regenerateWorklistFileAction(orderId);
      if (!(res as any).success) {
        setError((res as any).error || "Không cập nhật được order.");
        return;
      }
      setMessage(
        action === "checkin" ? "Đã check-in bệnh nhân."
        : action === "cancel" ? "Đã hủy order."
        : "Đã tạo lại file MWL."
      );
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Không cập nhật được order.");
    } finally {
      setBusyOrderId("");
    }
  };

  const runHisSync = async (accessionNumber: string) => {
    setBusyOrderId(accessionNumber);
    try {
      const res = await updateOrderFromHisAction(accessionNumber);
      if (res.success) { setMessage(`Đã đồng bộ HIS: ${accessionNumber}`); await loadOrders(); }
      else setError(res.error || "Lỗi HIS.");
    } catch (err: any) {
      setError(err?.message || "Lỗi HIS.");
    } finally {
      setBusyOrderId("");
    }
  };

  const handleClinicalSave = async (data: any) => {
    if (!activeOrder?.studyInstanceUid) return { success: false, error: "Không tìm thấy DICOM" };
    try {
      const res = clinicalModalMode === "CLINICAL_INFO"
        ? await updateClinicalInfoAction(activeOrder.studyInstanceUid, data)
        : await addIndicationAction(activeOrder.studyInstanceUid, data);
      if (res.success) { setClinicalModalOpen(false); await loadOrders(); }
      return res;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const openViewer = (order: WorklistOrderView) => {
    if (!order.studyInstanceUid) return;
    window.open(`/viewer/minipacs?StudyInstanceUIDs=${encodeURIComponent(order.studyInstanceUid)}`, "_blank");
  };

  const runViewToDictate = async (order: WorklistOrderView) => {
    if (!order.studyInstanceUid) return;
    const targetUrl = `/viewer/minipacs?StudyInstanceUIDs=${encodeURIComponent(order.studyInstanceUid)}`;
    const viewerWindow = window.open("about:blank", "_blank");
    if (!viewerWindow) { setError("Popup bị chặn."); return; }
    setBusyOrderId(order.id);
    try {
      const res = await startReadingAction(order.id, order.studyInstanceUid);
      if (!res.success) { viewerWindow.close(); setError(res.error || "Không thể khóa ca đọc."); return; }
      viewerWindow.location.href = targetUrl;
      await loadOrders();
    } catch (err: any) {
      viewerWindow.close();
      setError(err?.message || "Lỗi.");
    } finally {
      setBusyOrderId("");
    }
  };

  const openNonDicomCapture = async (order: WorklistOrderView) => {
    if (order.nonDicomExamId) {
      window.open(`/non-dicom/${order.nonDicomExamId}`, "_blank");
    } else {
      setBusyOrderId(order.id);
      try {
        const res = await createNonDicomExamFromWorklistAction(order.id);
        if (res.success && res.examId) { window.open(`/non-dicom/${res.examId}`, "_blank"); loadOrders(); }
        else setError(res.error || "Không thể tạo ca Non-DICOM.");
      } catch (err: any) { setError(err?.message || "Lỗi."); }
      finally { setBusyOrderId(""); }
    }
  };

  const canOpenViewer = (order: WorklistOrderView) => {
    return Boolean(order.studyInstanceUid && order.studyStatus && !["ORDERED", "READY_FOR_SCAN"].includes(order.studyStatus));
  };

  const canLockForReading = (order: WorklistOrderView) => {
    return order.allowedActions?.draftReport && Boolean(order.studyInstanceUid && order.studyStatus && ["READY_TO_READ", "READING"].includes(order.studyStatus));
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 40,
      render: (_: any, __: any, index: number) => <Text type="secondary" style={{ fontSize: 11 }}>{index + 1}</Text>
    },
    {
      title: "Bệnh nhân",
      key: "patient",
      width: 200,
      render: (_: any, order: WorklistOrderView) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 12 }}>{order.patientName}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>PID: {order.patientId}</Text>
          {order.accessionNumber && <Text type="secondary" style={{ fontSize: 10, fontFamily: "monospace" }}>{order.accessionNumber}</Text>}
        </Space>
      )
    },
    {
      title: "Chỉ định",
      key: "procedure",
      width: 220,
      render: (_: any, order: WorklistOrderView) => (
        <Space direction="vertical" size={0}>
          <Text ellipsis style={{ maxWidth: 200, fontSize: 12 }}>{order.procedureDescription || order.bodyPart || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{order.referringPhysician || "-"}</Text>
        </Space>
      )
    },
    {
      title: "Mod",
      dataIndex: "modality",
      width: 60,
      render: (text: string) => <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 11 }}>{text}</Tag>
    },
    {
      title: "Lịch",
      key: "schedule",
      width: 100,
      render: (_: any, order: WorklistOrderView) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 11 }}>{formatDateTime(order.scheduledDate)}</Text>
          <Tag color={getPriorityColor(order.priority)} style={{ fontSize: 10 }}>{order.priority}</Tag>
        </Space>
      )
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_: any, order: WorklistOrderView) => (
        <Space direction="vertical" size={0} align="center">
          <Tag color={getOrderStatusColor(order.orderStatus)}>{orderStatusLabels[order.orderStatus] || order.orderStatus}</Tag>
          {order.studyStatus && <Tag color={getStudyStatusColor(order.studyStatus)} style={{ fontSize: 10 }}>{studyStatusLabels[order.studyStatus] || order.studyStatus}</Tag>}
        </Space>
      )
    },
    {
      title: "Tác vụ",
      key: "actions",
      width: 130,
      align: "right" as const,
      render: (_: any, order: WorklistOrderView) => {
        const busy = busyOrderId === order.id || busyOrderId === order.accessionNumber;
        const items: any[] = [];
        
        if (order.orderStatus === "REQUESTED" || order.orderStatus === "SCHEDULED") {
          items.push({ key: "checkin", label: "Check-in", icon: <CheckCircleOutlined />, onClick: () => runOrderAction(order.id, "checkin") });
          items.push({ key: "cancel", label: "Hủy order", icon: <CloseCircleOutlined />, danger: true, onClick: () => runOrderAction(order.id, "cancel") });
        }
        if (order.allowedActions?.regenerateFile) {
          items.push({ key: "regen", label: "Tạo lại MWL", icon: <FileAddOutlined />, onClick: () => runOrderAction(order.id, "regen") });
        }
        if (canSyncHis && order.accessionNumber) {
          items.push({ key: "his", label: "Sync HIS", icon: <SyncOutlined />, onClick: () => runHisSync(order.accessionNumber!) });
        }
        if (canUpdateClinical && order.studyInstanceUid) {
          items.push({ key: "clinical", label: "Cập nhật lâm sàng", icon: <EditOutlined />, onClick: () => { setActiveOrder(order); setClinicalModalMode("CLINICAL_INFO"); setClinicalModalOpen(true); } });
        }
        if (order.allowedActions?.createNonDicom) {
          items.push({ key: "nondicom", label: "Non-DICOM Capture", icon: <CameraOutlined />, onClick: () => openNonDicomCapture(order) });
        }

        return (
          <Space size={4}>
            {canOpenViewer(order) && (
              <Tooltip title="Mở viewer">
                <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => openViewer(order)} />
              </Tooltip>
            )}
            {canLockForReading(order) && (
              <Tooltip title="Mở & Đọc">
                <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => runViewToDictate(order)} loading={busy} />
              </Tooltip>
            )}
            {items.length > 0 && (
              <Dropdown menu={{ items }} trigger={["click"]}>
                <Button size="small" type="text" icon={<MoreOutlined />} loading={busy} />
              </Dropdown>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--vin-border-subtle, #303030)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <ScreenHeader />
              <Text type="secondary" style={{ fontSize: 11 }}>{orders.length} order trong ngày</Text>
            </div>
            <Button size="small" icon={<ReloadOutlined />} onClick={loadOrders} loading={isLoading}>Làm mới</Button>
          </div>

          {(message || error) && (
            <Alert
              style={{ marginBottom: 8 }}
              type={error ? "error" : "success"}
              message={error || message}
              showIcon closable
              onClose={() => { setError(""); setMessage(""); }}
            />
          )}

          <Space wrap size={4}>
            <DatePicker
              size="small"
              value={dayjs(selectedDate)}
              onChange={(d) => d && setSelectedDate(d.format("YYYY-MM-DD"))}
              allowClear={false}
            />
            <Select
              size="small"
              style={{ width: 130 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "REQUESTED", label: "Mới tạo" },
                { value: "SCHEDULED", label: "Đã hẹn" },
                { value: "ARRIVED", label: "Đã đến" },
                { value: "CANCELLED", label: "Đã hủy" },
                { value: "EXPIRED", label: "Quá hạn" },
              ]}
            />
            <Input.Search
              size="small"
              placeholder="Tìm tên, PID, accession..."
              allowClear
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onSearch={loadOrders}
              style={{ width: 280 }}
            />
          </Space>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <Table
            size="small"
            dataSource={orders}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            scroll={{ y: "calc(100vh - 180px)" }}
            onRow={(record) => ({
              onDoubleClick: () => {
                // Double-click opens the correct Study UID viewer
                if (record.studyInstanceUid && canOpenViewer(record)) {
                  openViewer(record);
                }
              },
              onKeyDown: (e) => {
                // Enter/Space opens viewer on focused row
                if ((e.key === "Enter" || e.key === " ") && record.studyInstanceUid && canOpenViewer(record)) {
                  e.preventDefault();
                  openViewer(record);
                }
              },
              tabIndex: 0,
              style: { cursor: "pointer" },
            })}
          />
        </div>
      </div>

      <ClinicalInfoModal
        isOpen={clinicalModalOpen}
        studyInstanceUid={activeOrder?.studyInstanceUid || ""}
        mode={clinicalModalMode}
        initialData={{
          procedureCode: activeOrder?.procedureCode || "",
          procedureDescription: activeOrder?.procedureDescription || "",
          clinicalInfo: activeOrder?.clinicalInfo || "",
          technologistId: activeOrder?.technologistId || "",
          bodyPart: activeOrder?.bodyPart || "",
        }}
        technologists={technologists}
        onSave={handleClinicalSave}
        onClose={() => setClinicalModalOpen(false)}
      />
    </div>
  );
}
