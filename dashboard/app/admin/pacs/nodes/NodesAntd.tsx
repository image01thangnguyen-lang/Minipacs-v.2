"use client";

import { useEffect, useState } from "react";
import { Table, Modal, Form, Input, Select, Button, Spin, Tag, message, Typography, Space, App } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined, ApiOutlined, DesktopOutlined } from "@ant-design/icons";
import {
  getNodesAction,
  upsertNodeAction,
  deleteNodeAction,
  pingNodeAction,
  getNodeReferencesAction
} from "./actions";
import type { DicomNodeInput } from "./schema";

const { Text } = Typography;

export function NodesAntd() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [references, setReferences] = useState<any>({
    facilities: [], procedures: [], storageFolders: [], shareFolders: [], uploadFolders: [], printTemplates: [], reportTemplates: [], serviceTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [busyNodeId, setBusyNodeId] = useState("");
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [form] = Form.useForm<DicomNodeInput>();
  const { message: antdMessage, modal: antdModal } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, refData] = await Promise.all([
        getNodesAction(),
        getNodeReferencesAction()
      ]);
      setNodes(data);
      setReferences(refData);
    } catch (err: any) {
      antdMessage.error(err.message || "Lỗi tải danh sách máy chụp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý Máy Chụp (DICOM Nodes)";
    loadData();
  }, []);

  const handleAddNew = () => {
    setEditingNode(null);
    form.resetFields();
    form.setFieldsValue({
      port: 104,
      modality: "DX",
      isActive: true,
      isNonDicom: false,
    });
    setModalVisible(true);
  };

  const handleEdit = (node: any) => {
    setEditingNode(node);
    form.resetFields();
    form.setFieldsValue({
      id: node.id,
      name: node.name,
      aeTitle: node.aeTitle,
      ipAddress: node.ipAddress,
      port: node.port,
      modality: node.modality,
      room: node.room || "",
      isActive: node.isActive,
      orthancAlias: node.orthancAlias,
      isNonDicom: node.isNonDicom,
      facilityId: node.facilityId || undefined,
      defaultFolderId: node.defaultFolderId || undefined,
      defaultShareFolderId: node.defaultShareFolderId || undefined,
      defaultUploadFolderId: node.defaultUploadFolderId || undefined,
      defaultProcedureCatalogId: node.defaultProcedureCatalogId || undefined,
      defaultPrintTemplateId: node.defaultPrintTemplateId || undefined,
      defaultReportTemplateTextId: node.defaultReportTemplateTextId || undefined,
      serviceTypeId: node.serviceTypeId || undefined,
    });
    setModalVisible(true);
  };

  const onSubmit = async (values: DicomNodeInput) => {
    try {
      const res = await upsertNodeAction(values);
      if (res.success) {
        antdMessage.success(values.id ? "Đã cập nhật máy chụp thành công" : "Đã thêm máy chụp mới");
        setModalVisible(false);
        loadData();
      } else {
        antdMessage.error(res.error || "Có lỗi xảy ra khi lưu máy chụp");
      }
    } catch (err: any) {
      antdMessage.error(err.message || "Lỗi kết nối khi lưu");
    }
  };

  const runPing = async (id: string) => {
    setBusyNodeId(id);
    try {
      const res = await pingNodeAction(id);
      if (res.success) {
        loadData();
      } else {
        antdMessage.error(res.error || "Không thể ping máy chụp");
      }
    } catch (err: any) {
      antdMessage.error(err.message || "Lỗi khi ping");
    } finally {
      setBusyNodeId("");
    }
  };

  const runDelete = (id: string) => {
    antdModal.confirm({
      title: 'Xóa máy chụp',
      content: 'Bạn có chắc chắn muốn xóa máy chụp này? (Bao gồm xóa khỏi database và Orthanc)',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setBusyNodeId(id);
        try {
          const res = await deleteNodeAction(id);
          if (res.success) {
            antdMessage.success("Đã xóa máy chụp thành công");
            loadData();
          } else {
            antdMessage.error(res.error || "Không thể xóa máy chụp");
          }
        } catch (err: any) {
          antdMessage.error(err.message || "Lỗi khi xóa");
        } finally {
          setBusyNodeId("");
        }
      },
    });
  };

  const columns = [
    {
      title: "Tên & Alias",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: "white" }}>{text}</div>
          <Space size="middle" style={{ marginTop: 4 }}>
            <Tag color="blue">{record.modality}</Tag>
            {!record.isNonDicom && <Text type="secondary" style={{ fontSize: 10 }}>{record.orthancAlias}</Text>}
            {!record.isActive && <Tag color="error">Tắt</Tag>}
            {record.isNonDicom && <Tag color="warning">Non-DICOM</Tag>}
          </Space>
          {record.facility && (
            <div style={{ fontSize: 10, color: "gray", marginTop: 4 }}>{record.facility.name}</div>
          )}
        </div>
      )
    },
    {
      title: "Mạng (IP:Port)",
      key: "network",
      render: (_, record: any) => (
        <div>
          {record.isNonDicom ? (
            <Text type="secondary" italic>Không áp dụng</Text>
          ) : (
            <Text code>{record.ipAddress}:{record.port}</Text>
          )}
          <div style={{ fontSize: 10, color: "gray", marginTop: 4 }}>{record.room || "-"}</div>
        </div>
      )
    },
    {
      title: "AE Title",
      key: "aeTitle",
      align: "center" as const,
      render: (_, record: any) => (
        record.isNonDicom ? (
          <Text type="secondary" italic>-</Text>
        ) : (
          <Text strong style={{ color: "#13C2C2", fontFamily: "monospace" }}>{record.aeTitle}</Text>
        )
      )
    },
    {
      title: "Kết nối",
      key: "connection",
      align: "center" as const,
      render: (_, record: any) => {
        if (record.isNonDicom) return <Text type="secondary" italic>-</Text>;
        if (record.lastEchoStatus === "OK") {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Tag color="success">OK</Tag>
              {record.lastEchoAt && (
                <span style={{ fontSize: 9, color: "gray", marginTop: 4 }}>
                  {new Date(record.lastEchoAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          );
        }
        if (record.lastEchoStatus === "FAILED") {
          return <Tag color="error">FAILED</Tag>;
        }
        return <Text type="secondary" style={{ fontSize: 10 }}>Chưa test</Text>;
      }
    },
    {
      title: "Tác vụ",
      key: "actions",
      align: "right" as const,
      render: (_, record: any) => {
        const isBusy = busyNodeId === record.id;
        return (
          <Space>
            {!record.isNonDicom && (
              <Button
                size="middle"
                icon={isBusy ? <Spin /> : <ApiOutlined />}
                onClick={() => runPing(record.id)}
                title="Kiểm tra kết nối (C-Echo)"
                disabled={isBusy}
              />
            )}
            <Button
              size="middle"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="Sửa cấu hình"
              disabled={isBusy}
            />
            <Button
              size="middle"
              danger
              icon={<DeleteOutlined />}
              onClick={() => runDelete(record.id)}
              title="Xóa máy chụp"
              disabled={isBusy}
            />
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DesktopOutlined /> Quản lý Máy Chụp (DICOM Nodes)
          </h2>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Khai báo danh sách thiết bị để nhận/gửi ảnh DICOM tới Orthanc PACS.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
            Thêm máy chụp
          </Button>
        </Space>
      </div>

      <Table
        size="middle"
        dataSource={nodes}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingNode ? "Cập nhật máy chụp" : "Thêm máy chụp mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item name="name" label="Tên thiết bị hiển thị *" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: X-Quang Phòng 1" />
          </Form.Item>
          
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="orthancAlias" label="Orthanc Alias (ID) *" rules={[{ required: true }]} style={{ flex: 1 }}>
               <Input disabled={!!editingNode} placeholder="cr_room1" />
            </Form.Item>
            <Form.Item name="modality" label="Modality *" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "DX", label: "DX (X-Quang Số)" },
                  { value: "CR", label: "CR (X-Quang Cassette)" },
                  { value: "US", label: "US (Siêu âm)" },
                  { value: "CT", label: "CT (Cắt lớp)" },
                  { value: "MR", label: "MR (Cộng hưởng từ)" },
                  { value: "MG", label: "MG (Nhũ ảnh)" },
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item name="aeTitle" label="DICOM AE Title *" rules={[{ required: true }]} extra="Tối đa 16 ký tự, thường viết hoa. Phải khớp với cấu hình Local AE trên máy chụp.">
            <Input placeholder="CR_ROOM1" maxLength={16} />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="ipAddress" label="Địa chỉ IP *" rules={[{ required: true }]} style={{ flex: 1 }}>
               <Input placeholder="192.168.1.100" />
            </Form.Item>
            <Form.Item name="port" label="Port *" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input type="number" placeholder="104" />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="room" label="Phòng chụp" style={{ flex: 1 }}>
               <Input placeholder="Phòng số 1" />
            </Form.Item>
            <Form.Item name="isActive" label="Trạng thái" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: true, label: "Đang hoạt động" },
                  { value: false, label: "Tạm ngưng" },
                ]}
              />
            </Form.Item>
          </Space>

          <Typography.Title level={5} style={{ marginTop: '24px', borderBottom: '1px solid #434343', paddingBottom: '8px' }}>Cấu hình Mở rộng</Typography.Title>
          
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="isNonDicom" label="Loại thiết bị" style={{ flex: 1 }}>
               <Select
                  options={[
                    { value: false, label: "DICOM (Chuẩn)" },
                    { value: true, label: "Non-DICOM (Nội soi, Siêu âm màu...)" },
                  ]}
                />
            </Form.Item>
            <Form.Item name="facilityId" label="Cơ sở / Chi nhánh" style={{ flex: 1 }}>
              <Select
                allowClear
                placeholder="-- Không gán --"
                options={references.facilities.map((f: any) => ({ value: f.id, label: f.name }))}
              />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="defaultFolderId" label="Thư mục lưu ảnh" style={{ flex: 1 }}>
              <Select allowClear placeholder="-- Mặc định --" options={references.storageFolders.map((f: any) => ({ value: f.id, label: f.name }))} />
            </Form.Item>
            <Form.Item name="defaultShareFolderId" label="Thư mục chia sẻ" style={{ flex: 1 }}>
              <Select allowClear placeholder="-- Mặc định --" options={references.shareFolders.map((f: any) => ({ value: f.id, label: f.name }))} />
            </Form.Item>
            <Form.Item name="defaultUploadFolderId" label="Thư mục tải lên" style={{ flex: 1 }}>
              <Select allowClear placeholder="-- Mặc định --" options={references.uploadFolders.map((f: any) => ({ value: f.id, label: f.name }))} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="serviceTypeId" label="Dịch vụ Kỹ thuật" style={{ flex: 1 }}>
               <Select allowClear placeholder="-- Không gán --" options={references.serviceTypes.map((t: any) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
            <Form.Item name="defaultProcedureCatalogId" label="Dịch vụ/Thủ thuật (Procedure)" style={{ flex: 1 }}>
              <Select allowClear placeholder="-- Không gán --" options={references.procedures.map((t: any) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="defaultPrintTemplateId" label="Mẫu In mặc định" style={{ flex: 1 }}>
               <Select allowClear placeholder="-- Không gán --" options={references.printTemplates.map((t: any) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
            <Form.Item name="defaultReportTemplateTextId" label="Mẫu Báo cáo mặc định" style={{ flex: 1 }}>
              <Select allowClear placeholder="-- Không gán --" options={references.reportTemplates.map((t: any) => ({ value: t.id, label: t.name }))} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
