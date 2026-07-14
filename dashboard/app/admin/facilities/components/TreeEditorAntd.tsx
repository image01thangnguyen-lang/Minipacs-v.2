"use client";

import { useEffect, useState, useMemo } from "react";
import { Tree, Modal, Form, Input, Select, Button, Spin, Alert, Checkbox, Tag, Space, Typography, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined, SwapOutlined, ReloadOutlined, InfoCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, WarningOutlined } from "@ant-design/icons";
import {
  getOrganizationTreeAction,
  createFacilityUnitAction,
  deactivateFacilityUnitAction,
  reactivateFacilityUnitAction,
  moveFacilityUnitAction,
  updateFacilityUnitAction,
  previewMoveImpactAction,
  previewDeactivateImpactAction,
  reorderFacilityUnitsAction
} from "../actions";

const { Text, Title } = Typography;

type ModalState = {
  type: "ADD" | "MOVE" | "DEACTIVATE" | null;
  targetNode?: any;
};

export function TreeEditorAntd() {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Layout States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modal States
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Form instances
  const [formDetail] = Form.useForm();
  const [formAdd] = Form.useForm();
  const [formMove] = Form.useForm();
  const [formDeactivate] = Form.useForm();

  // Impact states
  const [impact, setImpact] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");

  const loadTree = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationTreeAction(includeInactive);
      setUnits(data);
      if (selectedNodeId) {
        const node = data.find((u: any) => u.id === selectedNodeId);
        if (node) {
          formDetail.setFieldsValue({ name: node.name, code: node.code });
        } else {
          setSelectedNodeId(null);
        }
      }
    } catch (err: any) {
      setError("Không thể tải cây tổ chức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [includeInactive]);

  const handleAddSubmit = async (values: any) => {
    setActionLoading(true);
    const res = await createFacilityUnitAction({
      name: values.name,
      code: values.code,
      type: values.type,
      parentId: modal.targetNode ? modal.targetNode.id : null
    });
    if (res.success) {
      setModal({ type: null });
      formAdd.resetFields();
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleMoveSubmit = async (values: any) => {
    setActionLoading(true);
    const res = await moveFacilityUnitAction({
      unitId: modal.targetNode.id,
      newParentId: values.newParentId || null
    });
    if (res.success) {
      setModal({ type: null });
      formMove.resetFields();
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDeactivateSubmit = async (values: any) => {
    setActionLoading(true);
    const res = await deactivateFacilityUnitAction({
      unitId: modal.targetNode.id,
      strategy: values.strategy
    });
    if (res.success) {
      setModal({ type: null });
      formDeactivate.resetFields();
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleReactivate = async (nodeId: string) => {
    setActionLoading(true);
    const res = await reactivateFacilityUnitAction({ unitId: nodeId });
    if (res.success) {
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const handleDetailSave = async (values: any) => {
    if (!selectedNodeId) return;
    setActionLoading(true);
    const res = await updateFacilityUnitAction({
      unitId: selectedNodeId,
      name: values.name
    });
    if (res.success) {
      loadTree();
    } else {
      alert("Lỗi: " + res.error);
    }
    setActionLoading(false);
  };

  const openMoveModal = async (node: any) => {
    setModal({ type: "MOVE", targetNode: node });
    setImpact(null);
    setImpactError("");
    setImpactLoading(true);
    formMove.setFieldsValue({ newParentId: "" });
    try {
      const res = await previewMoveImpactAction(node.id);
      setImpact(res);
    } catch (err: any) {
      setImpactError(err.message || "Failed to load impact");
    } finally {
      setImpactLoading(false);
    }
  };

  const openDeactivateModal = async (node: any) => {
    setModal({ type: "DEACTIVATE", targetNode: node });
    setImpact(null);
    setImpactError("");
    setImpactLoading(true);
    formDeactivate.setFieldsValue({ strategy: "BLOCK" });
    try {
      const res = await previewDeactivateImpactAction(node.id);
      setImpact(res);
    } catch (err: any) {
      setImpactError(err.message || "Failed to load impact");
    } finally {
      setImpactLoading(false);
    }
  };

  const handleReorder = async (node: any, direction: 'UP' | 'DOWN') => {
    const siblings = units
      .filter(u => u.parentId === node.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const currentIndex = siblings.findIndex(s => s.id === node.id);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const updates = reordered.map((s, idx) => ({ id: s.id, sortOrder: idx }));

    setUnits(prev => prev.map(u => {
      const update = updates.find(upd => upd.id === u.id);
      if (update) return { ...u, sortOrder: update.sortOrder };
      return u;
    }));

    const res = await reorderFacilityUnitsAction(updates);
    if (!res.success) {
      alert("Lỗi sắp xếp: " + res.error);
      loadTree(); 
    }
  };

  const buildTree = (parentId: string | null): any[] => {
    return units
      .filter((u) => u.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((u) => {
        const titleContent = (
          <div className="flex items-center justify-between w-full">
            <div>
              <Text strong style={{ color: "white" }}>{u.name}</Text>
              <Text type="secondary" className="ml-2">({u.code})</Text>
              {!u.isActive && <Tag color="error" className="ml-2">Ngừng hoạt động</Tag>}
              <div style={{ fontSize: "11px", color: "gray" }}>{u.type}</div>
            </div>
            <Space onClick={e => e.stopPropagation()}>
              {u.isActive ? (
                <>
                  <Tooltip title="Lên"><Button size="small" type="text" icon={<ArrowUpOutlined />} onClick={() => handleReorder(u, 'UP')} /></Tooltip>
                  <Tooltip title="Xuống"><Button size="small" type="text" icon={<ArrowDownOutlined />} onClick={() => handleReorder(u, 'DOWN')} /></Tooltip>
                  <Tooltip title="Thêm nút con"><Button size="small" type="text" icon={<PlusOutlined />} onClick={() => { setModal({ type: "ADD", targetNode: u }); formAdd.resetFields(); formAdd.setFieldsValue({ type: "HOSPITAL" }); }} /></Tooltip>
                  <Tooltip title="Chuyển (Move)"><Button size="small" type="text" icon={<SwapOutlined />} onClick={() => openMoveModal(u)} /></Tooltip>
                  <Tooltip title="Hủy kích hoạt"><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => openDeactivateModal(u)} /></Tooltip>
                </>
              ) : (
                <Tooltip title="Khôi phục"><Button size="small" type="text" icon={<ReloadOutlined style={{color:"#52c41a"}}/>} onClick={() => handleReactivate(u.id)} /></Tooltip>
              )}
            </Space>
          </div>
        );
        return {
          title: titleContent,
          key: u.id,
          children: buildTree(u.id)
        };
      });
  };

  const treeData = useMemo(() => buildTree(null), [units]);
  const selectedNodeData = units.find(u => u.id === selectedNodeId);

  // When selectedNodeData changes, update detail form
  useEffect(() => {
    if (selectedNodeData) {
      formDetail.setFieldsValue({ name: selectedNodeData.name, code: selectedNodeData.code });
    } else {
      formDetail.resetFields();
    }
  }, [selectedNodeData, formDetail]);

  const onStrategyChange = Form.useWatch('strategy', formDeactivate);

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" showIcon />}
      <div className="flex items-center justify-between">
        <Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)}>
          Hiển thị đơn vị đã ngừng hoạt động
        </Checkbox>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setModal({ type: "ADD" }); formAdd.resetFields(); formAdd.setFieldsValue({ type: "CHAIN" }); }}
        >
          Thêm đơn vị gốc
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Input.Search
            placeholder="Tìm kiếm theo Tên hoặc Mã..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
          />
          <div className="bg-vin-panel border border-vin-border rounded-lg p-4 h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex h-32 items-center justify-center"><Spin /></div>
            ) : treeData.length > 0 ? (
              <Tree
                treeData={treeData}
                selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                onSelect={(selectedKeys) => {
                  if (selectedKeys.length > 0) {
                    setSelectedNodeId(selectedKeys[0] as string);
                  } else {
                    setSelectedNodeId(null);
                  }
                }}
                blockNode
                defaultExpandAll
                className="bg-transparent"
              />
            ) : (
              <Alert message="Không tìm thấy đơn vị tổ chức nào." type="info" showIcon />
            )}
          </div>
        </div>

        <div>
          <div className="bg-vin-panel border border-vin-border rounded-lg p-5 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <InfoCircleOutlined /> Chi tiết đơn vị
            </h3>
            {selectedNodeData ? (
              <Form form={formDetail} layout="vertical" onFinish={handleDetailSave}>
                <div className="mb-4">
                  <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold mb-1">Trạng thái</Text>
                  {selectedNodeData.isActive ? (
                    <Tag color="success">Đang hoạt động</Tag>
                  ) : (
                    <Tag color="error">Ngừng hoạt động</Tag>
                  )}
                </div>
                <div className="mb-4">
                  <Text type="secondary" className="block text-xs uppercase tracking-wide font-bold mb-1">Loại Taxonomy</Text>
                  <Tag>{selectedNodeData.type}</Tag>
                </div>
                <Form.Item name="code" label="Mã đơn vị (Code)">
                  <Input readOnly disabled />
                </Form.Item>
                <Form.Item name="name" label="Tên đơn vị" rules={[{ required: true }]}>
                  <Input disabled={!selectedNodeData.isActive} />
                </Form.Item>
                {selectedNodeData.isActive && (
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={actionLoading} block>
                      Lưu thay đổi
                    </Button>
                  </Form.Item>
                )}
              </Form>
            ) : (
              <Text type="secondary" className="block text-center mt-8">
                Chọn một đơn vị trên cây tổ chức để xem và chỉnh sửa thông tin.
              </Text>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={modal.targetNode ? `Thêm nút con cho: ${modal.targetNode.name}` : "Thêm đơn vị gốc"}
        open={modal.type === "ADD"}
        onCancel={() => setModal({ type: null })}
        onOk={() => formAdd.submit()}
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form form={formAdd} layout="vertical" onFinish={handleAddSubmit}>
          <Form.Item name="code" label="Mã đơn vị (Code)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên đơn vị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại (Taxonomy)" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "CHAIN", label: "Chuỗi (CHAIN)" },
                { value: "HOSPITAL", label: "Bệnh viện (HOSPITAL)" },
                { value: "DEPARTMENT", label: "Khoa phòng (DEPARTMENT)" },
                { value: "SPECIALTY", label: "Chuyên khoa (SPECIALTY)" },
                { value: "ROOM", label: "Phòng chụp (ROOM)" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Chuyển đơn vị: ${modal.targetNode?.name}`}
        open={modal.type === "MOVE"}
        onCancel={() => setModal({ type: null })}
        onOk={() => formMove.submit()}
        confirmLoading={actionLoading || impactLoading || !!impactError}
        okButtonProps={{ disabled: !!impactError }}
        destroyOnClose
      >
        <Form form={formMove} layout="vertical" onFinish={handleMoveSubmit}>
          <Form.Item name="newParentId" label="Đơn vị cha mới">
            <Select
              allowClear
              placeholder="-- Trở thành đơn vị gốc --"
              options={units.filter(u => u.id !== modal.targetNode?.id && u.isActive).map(u => ({ value: u.id, label: `${u.name} (${u.type})` }))}
            />
          </Form.Item>
          {impactLoading ? (
            <div className="text-center"><Spin /></div>
          ) : impactError ? (
            <Alert type="error" message={`Lỗi tải preview: ${impactError}`} />
          ) : impact ? (
            <Alert
              type="warning"
              showIcon
              message="Ảnh hưởng dự kiến"
              description={
                <ul className="list-disc list-inside mt-2">
                  <li><strong>{impact.affectedDescendants}</strong> đơn vị con</li>
                  <li><strong>{impact.affectedMachines}</strong> máy chụp</li>
                  <li><strong>{impact.affectedGrants}</strong> phân quyền (Access Grants)</li>
                </ul>
              }
            />
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={<div><WarningOutlined style={{ color: 'red' }}/> Hủy kích hoạt</div>}
        open={modal.type === "DEACTIVATE"}
        onCancel={() => setModal({ type: null })}
        onOk={() => formDeactivate.submit()}
        confirmLoading={actionLoading || impactLoading || !!impactError}
        okButtonProps={{ danger: true, disabled: !!impactError || (onStrategyChange === "BLOCK" && impact && (impact.affectedDescendants > 0 || impact.affectedMachines > 0)) }}
        destroyOnClose
      >
        <Text type="secondary">Bạn đang muốn ngừng hoạt động <strong>{modal.targetNode?.name}</strong>.</Text>
        <Form form={formDeactivate} layout="vertical" onFinish={handleDeactivateSubmit} className="mt-4">
          <Form.Item name="strategy" label="Chiến lược xử lý">
            <Select
              options={[
                { value: "BLOCK", label: "BLOCK (Chặn nếu có đơn vị con / máy chụp)" },
                { value: "CASCADE", label: "CASCADE (Ngừng hoạt động tất cả đơn vị con và máy chụp)" }
              ]}
            />
          </Form.Item>
          {impactLoading ? (
             <div className="text-center"><Spin /></div>
          ) : impactError ? (
            <Alert type="error" message={`Lỗi tải preview: ${impactError}`} />
          ) : impact ? (
            <Alert
              type="error"
              message="Ảnh hưởng dự kiến"
              description={
                <>
                  <ul className="list-disc list-inside mt-2">
                    <li><strong>{impact.affectedDescendants}</strong> đơn vị con</li>
                    <li><strong>{impact.affectedMachines}</strong> máy chụp (DICOM Node)</li>
                  </ul>
                  {onStrategyChange === "BLOCK" && (impact.affectedDescendants > 0 || impact.affectedMachines > 0) && (
                    <div className="mt-2 font-semibold">CẢNH BÁO: Thao tác sẽ bị từ chối với chiến lược BLOCK do đang có đơn vị con hoặc máy chụp phụ thuộc.</div>
                  )}
                </>
              }
            />
          ) : null}
        </Form>
      </Modal>

    </div>
  );
}
