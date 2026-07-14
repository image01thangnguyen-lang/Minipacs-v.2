"use client";

import React, { useEffect, useState } from "react";
import { Table, Modal, Form, Input, Select, Button, Spin, Tag, message, Typography, Space, App, Row, Col, Checkbox } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined, FileTextOutlined } from "@ant-design/icons";
import {
  createPrintTemplateAction,
  deletePrintTemplateAction,
  getPrintTemplates,
  getTemplateReferences,
  updatePrintTemplateAction,
} from "./actions";

const { Text } = Typography;

export function TemplatesAntd() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [references, setReferences] = useState<any>({ facilities: [], procedures: [], nodes: [] });
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form] = Form.useForm();
  const { message: antdMessage, modal: antdModal } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplData, refData] = await Promise.all([
        getPrintTemplates(),
        getTemplateReferences()
      ]);
      setTemplates(tplData || []);
      setReferences(refData || { facilities: [], procedures: [], nodes: [] });
    } catch (err: any) {
      antdMessage.error(err.message || "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Print Templates & Mappings";
    loadData();
  }, []);

  const handleOpenForm = (template?: any) => {
    setEditingTemplate(template || null);
    form.resetFields();
    if (template) {
      form.setFieldsValue({
        id: template.id,
        code: template.code,
        name: template.name,
        description: template.description,
        htmlContent: template.htmlContent,
        isDefault: template.isDefault,
        modality: template.modality,
        bodyPart: template.bodyPart,
        facilityId: template.facilityId || undefined,
        procedureCatalogId: template.procedureCatalogId || undefined,
        dicomNodeId: template.dicomNodeId || undefined,
        paperSize: template.paperSize,
        orientation: template.orientation,
        isActive: template.isActive,
        sortOrder: template.sortOrder,
      });
    } else {
      form.setFieldsValue({
        paperSize: "A4",
        orientation: "PORTRAIT",
        isActive: true,
        sortOrder: 0,
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTemplate?.id) {
        await updatePrintTemplateAction(editingTemplate.id, values);
        antdMessage.success("Đã cập nhật mẫu in thành công.");
      } else {
        await createPrintTemplateAction(values);
        antdMessage.success("Đã thêm mẫu in mới thành công.");
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      antdMessage.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    antdModal.confirm({
      title: 'Xóa mẫu in',
      content: 'Bạn có chắc chắn muốn xóa mẫu in này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          await deletePrintTemplateAction(id);
          antdMessage.success("Xóa mẫu in thành công.");
          loadData();
        } catch (err: any) {
          antdMessage.error(err.message);
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "Mã & Tên",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div>
          <Text strong style={{ color: "white" }}>{record.code || "---"}</Text>
          <div style={{ color: "gray", fontSize: "12px", marginTop: "4px" }}>{text}</div>
        </div>
      )
    },
    {
      title: "Modality",
      dataIndex: "modality",
      key: "modality",
      align: "center" as const,
      render: (text: string) => <Tag>{text || "ALL"}</Tag>
    },
    {
      title: "Mặc định",
      dataIndex: "isDefault",
      key: "isDefault",
      align: "center" as const,
      render: (isDefault: boolean) => isDefault ? <Tag color="blue">CÓ</Tag> : <Text type="secondary">-</Text>
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (isActive: boolean) => isActive ? <Tag color="success">ACTIVE</Tag> : <Tag color="error">HIDDEN</Tag>
    },
    {
      title: "Tác vụ",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenForm(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined /> Print Templates & Mappings
          </h2>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Quản lý danh sách mẫu in (A4/A5) và ánh xạ tới máy/dịch vụ.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenForm()}>
            Tạo mới
          </Button>
        </Space>
      </div>

      <Table
        size="small"
        dataSource={templates}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={<div><FileTextOutlined style={{color: "#13C2C2"}}/> {editingTemplate ? "Chi tiết mẫu in" : "Tạo mới mẫu in"}</div>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ border: '1px solid #434343', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
             <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '16px', fontSize: '12px', color: 'gray' }}>THÔNG TIN CƠ BẢN</Typography.Title>
             <Row gutter={16}>
               <Col span={12}>
                  <Form.Item name="code" label="Mã (Code)">
                    <Input placeholder="VD: IN_CT01" />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item name="name" label="Tên / Tiêu đề" rules={[{ required: true }]}>
                    <Input placeholder="Tên mẫu in" />
                  </Form.Item>
               </Col>
               <Col span={24}>
                  <Form.Item name="description" label="Mô tả">
                    <Input placeholder="Ghi chú thêm..." />
                  </Form.Item>
               </Col>
             </Row>
          </div>

          <div style={{ border: '1px solid #434343', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
             <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '16px', fontSize: '12px', color: 'gray' }}>CẤU HÌNH BẢN IN</Typography.Title>
             <Row gutter={16}>
               <Col span={8}>
                  <Form.Item name="paperSize" label="Khổ giấy">
                    <Select options={[{value: "A4", label: "A4"}, {value: "A5", label: "A5"}]} />
                  </Form.Item>
               </Col>
               <Col span={8}>
                  <Form.Item name="orientation" label="Hướng giấy">
                    <Select options={[{value: "PORTRAIT", label: "Dọc (Portrait)"}, {value: "LANDSCAPE", label: "Ngang (Landscape)"}]} />
                  </Form.Item>
               </Col>
               <Col span={8}>
                 <Space direction="vertical" style={{ width: '100%', marginTop: '32px' }}>
                    <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Checkbox style={{ color: '#13C2C2' }}>Làm mặc định (Global)</Checkbox>
                    </Form.Item>
                    <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Checkbox>Kích hoạt sử dụng</Checkbox>
                    </Form.Item>
                 </Space>
               </Col>
             </Row>
          </div>

          <div style={{ border: '1px solid #434343', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
             <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '16px', fontSize: '12px', color: 'gray' }}>PHẠM VI & GÁN TỰ ĐỘNG</Typography.Title>
             <Row gutter={16}>
               <Col span={12}>
                  <Form.Item name="facilityId" label="Gán Cơ sở (Facility)">
                    <Select allowClear placeholder="-- Không gán --" options={references.facilities.map((f: any) => ({value: f.id, label: f.name}))} />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item name="dicomNodeId" label="Gán Máy (DICOM Node)">
                    <Select allowClear placeholder="-- Không gán --" options={references.nodes.map((n: any) => ({value: n.id, label: n.aeTitle}))} />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item name="modality" label="Gán Nhóm dịch vụ (Modality)">
                    <Input placeholder="ALL, CR, CT..." />
                  </Form.Item>
               </Col>
               <Col span={12}>
                  <Form.Item name="procedureCatalogId" label="Gán Dịch vụ (Procedure)">
                    <Select allowClear placeholder="-- Không gán --" options={references.procedures.map((p: any) => ({value: p.id, label: p.name}))} />
                  </Form.Item>
               </Col>
             </Row>
          </div>

          <div style={{ border: '1px solid #434343', padding: '16px', borderRadius: '8px' }}>
             <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '16px', fontSize: '12px', color: 'gray' }}>HTML / JS NÂNG CAO</Typography.Title>
             <Form.Item name="htmlContent" style={{ marginBottom: 0 }}>
               <Input.TextArea rows={8} style={{ fontFamily: 'monospace', fontSize: '12px' }} placeholder="<html><body><h1>Report</h1></body></html>" />
             </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
