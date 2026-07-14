"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table, Form, Input, Button, Modal, Select, Tag, Space, App, Typography, Checkbox, Row, Col, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  createReportTemplateTextAction,
  deleteReportTemplateTextAction,
  getReportTemplateTexts,
  updateReportTemplateTextAction,
} from "./actions";

const { Text } = Typography;

const modalityOptions = ["ALL", "DX", "CR", "US", "CT", "MR", "SRDX"];

const ModalityColors: Record<string, string> = {
  ALL: "default",
  US: "green",
  CT: "purple",
  MR: "purple",
  CR: "orange",
  DX: "orange",
  SRDX: "blue",
};

export function ReportTemplatesAntd() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  
  const { message: antdMessage, modal: antdModal } = App.useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getReportTemplateTexts({ includeInactive: true });
      setTemplates(data || []);
    } catch (err: any) {
      antdMessage.error(err.message || "Không tải được danh sách mẫu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Mẫu báo cáo văn bản";
    loadData();
  }, []);

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (modalityFilter !== "ALL") {
      list = list.filter(template => template.modality === modalityFilter || template.modality === "ALL");
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(template =>
        `${template.name} ${template.modality} ${template.bodyPart || ""} ${template.shortcut || ""} ${template.findings} ${template.conclusion}`
          .toLowerCase()
          .includes(query)
      );
    }
    return list;
  }, [modalityFilter, searchQuery, templates]);

  const handleOpenForm = (template?: any) => {
    setEditingTemplate(template || null);
    form.resetFields();
    if (template) {
      form.setFieldsValue({
        templateId: template.id,
        name: template.name,
        modality: template.modality,
        bodyPart: template.bodyPart,
        shortcut: template.shortcut,
        scope: template.scope,
        isNormal: template.isNormal,
        isActive: template.isActive,
        findings: template.findings,
        conclusion: template.conclusion,
        recommendation: template.recommendation,
      });
    } else {
      form.setFieldsValue({
        modality: "DX",
        scope: "GLOBAL",
        isNormal: false,
        isActive: true,
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          if (typeof values[key] === 'boolean') {
             if(values[key]) formData.append(key, "on");
          } else {
             formData.append(key, values[key]);
          }
        }
      });
      
      if (editingTemplate) {
        await updateReportTemplateTextAction(formData);
        antdMessage.success("Đã cập nhật mẫu báo cáo.");
      } else {
        await createReportTemplateTextAction(formData);
        antdMessage.success("Đã tạo mẫu báo cáo mới.");
      }
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      antdMessage.error(err.message || "Lỗi khi lưu mẫu báo cáo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    antdModal.confirm({
      title: 'Xóa mẫu báo cáo',
      content: 'Bạn có chắc chắn muốn xóa mẫu báo cáo này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        setLoading(true);
        try {
          await deleteReportTemplateTextAction(id);
          antdMessage.success("Xóa mẫu báo cáo thành công.");
          loadData();
        } catch (err: any) {
          antdMessage.error(err.message || "Lỗi khi xóa mẫu.");
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: "Tên mẫu",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div>
          <Text strong style={{ color: "white" }}>{text}</Text>
          <div style={{ color: "gray", fontSize: "12px", marginTop: "4px" }}>
            {record.bodyPart || "Không chọn body part"} · {record.scope === "GLOBAL" ? "Dùng chung" : (record.owner?.fullName || "Cá nhân")}
          </div>
        </div>
      )
    },
    {
      title: "Mod",
      dataIndex: "modality",
      key: "modality",
      align: "center" as const,
      render: (text: string) => <Tag color={ModalityColors[text] || "default"}>{text}</Tag>
    },
    {
      title: "Shortcut",
      dataIndex: "shortcut",
      key: "shortcut",
      render: (text: string) => <Text code>{text || "-"}</Text>
    },
    {
      title: "Phạm vi",
      dataIndex: "scope",
      key: "scope",
      align: "center" as const,
      render: (scope: string) => <Tag>{scope === "GLOBAL" ? "Chung" : "Cá nhân"}</Tag>
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (isActive: boolean) => isActive ? <Tag color="success">Đang dùng</Tag> : <Tag color="error">Đã ẩn</Tag>
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
            <FileTextOutlined /> Mẫu báo cáo
          </h2>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Quản lý {filteredTemplates.length} mẫu báo cáo.
          </Text>
        </div>
        <Space>
          <Input.Search 
            placeholder="Tìm tên, shortcut..." 
            allowClear 
            onSearch={(val) => setSearchQuery(val)} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 250 }} 
          />
          <Select 
            value={modalityFilter} 
            onChange={setModalityFilter} 
            options={[{ value: "ALL", label: "Tất cả Modality" }, ...modalityOptions.filter(m => m !== "ALL").map(m => ({ value: m, label: m }))]}
            style={{ width: 150 }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenForm()}>
            Tạo mẫu
          </Button>
        </Space>
      </div>

      <Table
        size="small"
        dataSource={filteredTemplates}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={<div><FileTextOutlined style={{color: "#13C2C2"}}/> {editingTemplate ? "Chi tiết mẫu báo cáo" : "Tạo mẫu báo cáo"}</div>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {editingTemplate && <Form.Item name="templateId" hidden><Input /></Form.Item>}
          
          <Form.Item name="name" label="Tên mẫu" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Phổi bình thường" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="modality" label="Modality">
                <Select options={modalityOptions.map(m => ({ value: m, label: m }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="bodyPart" label="Body part">
                <Input placeholder="CHEST" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="shortcut" label="Shortcut">
                <Input placeholder="/phoi" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="scope" label="Phạm vi">
                <Select options={[{ value: "GLOBAL", label: "Chung" }, { value: "PRIVATE", label: "Cá nhân" }]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Form.Item name="isNormal" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>Mẫu bình thường (Kết quả chuẩn)</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>Đang sử dụng</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="findings" label="Mô tả" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="Nhập nội dung mô tả..." />
          </Form.Item>

          <Form.Item name="conclusion" label="Kết luận" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhập kết luận..." />
          </Form.Item>

          <Form.Item name="recommendation" label="Đề nghị">
            <Input.TextArea rows={2} placeholder="Nhập đề nghị nếu có..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
