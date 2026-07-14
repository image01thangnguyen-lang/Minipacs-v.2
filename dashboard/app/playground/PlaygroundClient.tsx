"use client";

import React from "react";
import { Button, DatePicker, Drawer, Dropdown, Form, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography, notification } from "antd";

const { Title, Text } = Typography;

export function PlaygroundClient() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Status", dataIndex: "status", key: "status", render: (status: string) => <Tag color="processing">{status}</Tag> },
  ];
  const data = [
    { key: "1", name: "Test Component", status: "Active" },
    { key: "2", name: "AntD v5", status: "Pending" },
  ];

  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {notificationContextHolder}
      <Title level={4}>Ant Design v5 Clinical Playground</Title>
      <Space size="small" direction="vertical" style={{ width: "100%", padding: 8, border: "1px solid #303030", borderRadius: 2 }}>
        <Text strong>Controls (Size Small)</Text>
        <Space size="small" wrap>
          <Button type="primary" size="small" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button size="small">Default</Button>
          <Button size="small" disabled>Disabled</Button>
          <Input size="small" placeholder="Small Input" style={{ width: 120 }} />
          <Select size="small" placeholder="Select" style={{ width: 120 }} options={[{ value: "1", label: "Option 1" }]} />
          <DatePicker size="small" />
          <Tooltip title="Clinical tooltip"><Button size="small">Tooltip</Button></Tooltip>
          <Dropdown menu={{ items: [{ key: "one", label: "Option 1" }] }}><Button size="small">Dropdown</Button></Dropdown>
          <Button size="small" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <Button size="small" onClick={() => notificationApi.info({ message: "Context notification" })}>Notify</Button>
        </Space>
        <Form layout="inline" size="small"><Form.Item label="Form"><Input size="small" /></Form.Item></Form>
      </Space>
      <Space size="small" direction="vertical" style={{ width: "100%", padding: 8, border: "1px solid #303030", borderRadius: 2 }}>
        <Text strong>Data Display</Text>
        <Table size="small" columns={columns} dataSource={data} pagination={false} />
      </Space>
      <Modal title="Test Modal" open={modalOpen} onOk={() => setModalOpen(false)} onCancel={() => setModalOpen(false)} styles={{ body: { padding: 8 } }}>
        <p>This modal is portaled to body to avoid split-pane clipping.</p>
        <Input size="small" placeholder="Test focus" />
      </Modal>
      <Drawer title="Test Drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Input size="small" placeholder="Drawer focus target" />
      </Drawer>
    </div>
  );
}