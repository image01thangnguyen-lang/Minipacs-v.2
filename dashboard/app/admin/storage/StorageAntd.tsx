"use client";

import React, { useEffect, useState } from "react";
import { Table, Modal, Form, Input, Select, Button, Spin, Tag, message, Typography, Space, App, Card, Col, Row, Checkbox } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined, DesktopOutlined, DatabaseOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getStorageFoldersAction, upsertStorageFolderAction, checkStorageFolderAction, deleteStorageFolderAction } from "./actions";

const { Text, Title } = Typography;

export function StorageAntd() {
  const [folders, setFolders] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [form] = Form.useForm();
  const { message: antdMessage, modal: antdModal } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStorageFoldersAction();
      setFolders(data.folders as any[]);
      setFacilities(data.facilities);
    } catch (err: any) {
      antdMessage.error(err.message || "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Mini PACS - Quản lý lưu trữ";
    loadData();
  }, []);

  const handleOpenForm = (folder?: any) => {
    setEditingFolder(folder || null);
    form.resetFields();
    if (folder) {
      form.setFieldsValue({
        id: folder.id,
        code: folder.code,
        name: folder.name,
        type: folder.type,
        path: folder.path,
        facilityId: folder.facilityId || undefined,
        isActive: folder.isActive,
      });
    } else {
      form.setFieldsValue({ type: "NORMAL", isActive: true });
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const result = await upsertStorageFolderAction({
        ...values,
        id: editingFolder?.id,
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      antdMessage.success("Đã lưu cấu hình thành công.");
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      antdMessage.error(err.message);
    }
  };

  const handleCheck = async (id: string) => {
    setLoading(true);
    try {
      await checkStorageFolderAction(id);
      await loadData();
      antdMessage.success("Kiểm tra kết nối thành công");
    } catch (err: any) {
      antdMessage.error(err.message);
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    antdModal.confirm({
      title: 'Khóa cấu hình',
      content: 'Bạn có chắc chắn muốn khóa cấu hình này? (Cấu hình sẽ bị ẩn, không xóa hẳn)',
      okText: 'Khóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          const result = await deleteStorageFolderAction(id);
          if (!result.success) throw new Error(result.error);
          antdMessage.success("Khóa cấu hình thành công.");
          loadData();
        } catch (err: any) {
          antdMessage.error(err.message);
          setLoading(false);
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DatabaseOutlined /> Quản lý lưu trữ
          </h2>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Quản lý các thư mục lưu trữ ảnh DICOM, báo cáo, và sao lưu.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenForm()}>
            Thêm cấu hình
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spin /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {folders.map(folder => (
            <Col xs={24} md={12} lg={8} key={folder.id}>
              <Card 
                style={{ opacity: folder.isActive ? 1 : 0.6 }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ color: 'white' }}>{folder.name}</Text>
                    <Tag>{folder.type}</Tag>
                  </div>
                }
                extra={
                  <Space size="middle">
                    <Button type="text" size="middle" icon={<ReloadOutlined />} onClick={() => handleCheck(folder.id)} title="Kiểm tra kết nối" />
                    <Button type="text" size="middle" icon={<EditOutlined style={{color:"#13C2C2"}}/>} onClick={() => handleOpenForm(folder)} title="Sửa" />
                    <Button type="text" danger size="middle" icon={<DeleteOutlined />} onClick={() => handleDelete(folder.id)} title="Xóa" />
                  </Space>
                }
              >
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'bold' }}>MÃ: </Text>
                  <Text code>{folder.code}</Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'bold' }}>ĐƯỜNG DẪN: </Text>
                  <Text code ellipsis style={{ maxWidth: '100%' }} title={folder.path}>{folder.path}</Text>
                </div>
                {folder.facility && (
                  <div style={{ marginBottom: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'bold' }}>CƠ SỞ: </Text>
                    <Text>{folder.facility.name}</Text>
                  </div>
                )}
                
                <div style={{ marginTop: '16px', borderTop: '1px solid #434343', paddingTop: '8px' }}>
                   <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>TRẠNG THÁI KẾT NỐI:</Text>
                   {folder.lastCheckStatus === "OK" ? (
                     <Text type="success"><CheckCircleOutlined /> {folder.lastCheckMessage || "OK"}</Text>
                   ) : folder.lastCheckStatus === "READ_ONLY" ? (
                     <Text type="warning"><WarningOutlined /> {folder.lastCheckMessage || "Chỉ đọc"}</Text>
                   ) : folder.lastCheckStatus === "FAILED" ? (
                     <Text type="danger"><CloseCircleOutlined /> {folder.lastCheckMessage || "Lỗi kết nối"}</Text>
                   ) : (
                     <Text type="secondary">Chưa kiểm tra</Text>
                   )}
                   {folder.lastCheckAt && (
                      <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginTop: '4px' }}>Cập nhật: {new Date(folder.lastCheckAt).toLocaleString("vi-VN")}</Text>
                   )}
                </div>
              </Card>
            </Col>
          ))}
          {folders.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '40px', color: 'gray', border: '1px dashed #434343', borderRadius: '8px' }}>
                Chưa có cấu hình lưu trữ nào.
              </div>
            </Col>
          )}
        </Row>
      )}

      <Modal
        title={<div><DatabaseOutlined style={{color: "#13C2C2"}}/> {editingFolder ? "Sửa cấu hình lưu trữ" : "Thêm cấu hình lưu trữ"}</div>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="code" label="Mã (Code)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="vd: PRIMARY_STORE" />
            </Form.Item>
            <Form.Item name="type" label="Loại" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={[
                  {value: "NORMAL", label: "Normal (Thư mục mặc định)"},
                  {value: "SHARE", label: "Share (Chia sẻ mạng)"},
                  {value: "UPLOAD", label: "Upload (Tải lên)"},
                  {value: "BACKUP", label: "Backup (Sao lưu)"},
                ]}
              />
            </Form.Item>
          </Space>

          <Form.Item name="name" label="Tên cấu hình" rules={[{ required: true }]}>
            <Input placeholder="vd: Lưu trữ chính SSD" />
          </Form.Item>

          <Form.Item name="path" label="Đường dẫn (Path)" rules={[{ required: true }]}>
            <Input placeholder="vd: /mnt/data/pacs hoặc C:\PACS_Data" />
          </Form.Item>

          <Form.Item name="facilityId" label="Áp dụng cho cơ sở (Tùy chọn)">
            <Select
              allowClear
              placeholder="-- Tất cả --"
              options={facilities.map(f => ({value: f.id, label: f.name}))}
            />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" style={{ margin: 0, paddingTop: '8px', borderTop: '1px solid #434343' }}>
            <Checkbox>Kích hoạt sử dụng</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
