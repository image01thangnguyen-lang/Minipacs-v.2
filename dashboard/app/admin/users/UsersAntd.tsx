import React from "react";
import { App, Modal, Form, Input, Select, Checkbox, Upload, Button, Tabs, Spin, Alert, Table } from "antd";
import { UploadOutlined, PlusOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { UsersDataGrid, RolesDataGrid, ImportPreviewGrid, StatusBadge, RoleBadge } from "./AdminUsersGrids";
import { permissionGroups, permissionLabels, roleLabels as systemRoleLabels } from "@/lib/permissions";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";

export default function UsersAntd(props: any) {
  const {
    activeTab, setActiveTab, mode, setMode,
    users, roleProfiles, isLoading, isSaving,
    errorMessage, setErrorMessage,
    searchQuery, setSearchQuery,
    selectedUserId, setSelectedUserId,
    selectedRoleId, setSelectedRoleId,
    createFormKey, setCreateFormKey,
    createRoleFormKey, setCreateRoleFormKey,
    createRoleProfileId, setCreateRoleProfileId,
    editRoleProfileId, setEditRoleProfileId,
    importResults, setImportResults,
    filteredUsers, filteredRoles,
    handleCreateUserSubmit, handleUpdateUserSubmit,
    handleCreateRoleSubmit, handleUpdateRoleSubmit,
    handleImportSubmit,
    defaultRoleProfileId, selectedCreateRoleProfile,
    selectedEditRoleProfile, selectedUser, selectedRole,
    createUserIsDoctor, editUserIsDoctor
  } = props;

  const { message } = App.useApp();

  const [formUserCreate] = Form.useForm();
  const [formUserEdit] = Form.useForm();
  const [formRoleCreate] = Form.useForm();
  const [formRoleEdit] = Form.useForm();
  const [formImport] = Form.useForm();

  // Handle User Submit Map to FormData
  const onSubmitUser = (values: any, isEdit: boolean) => {
    const fd = new FormData();
    if (isEdit) fd.append("userId", selectedUserId);
    if (values.username) fd.append("username", values.username);
    if (values.fullName) fd.append("fullName", values.fullName);
    if (values.roleProfileId) fd.append("roleProfileId", values.roleProfileId);
    if (values.password) fd.append("password", values.password);
    if (values.isActive) fd.append("isActive", "on");
    
    if (values.title) fd.append("title", values.title);
    if (values.specialty) fd.append("specialty", values.specialty);
    if (values.licenseNumber) fd.append("licenseNumber", values.licenseNumber);
    if (values.isSigningDoctor) fd.append("isSigningDoctor", "on");
    
    if (values.signature?.fileList?.[0]?.originFileObj) {
      fd.append("signature", values.signature.fileList[0].originFileObj);
    }

    if (isEdit) handleUpdateUserSubmit(fd).then(() => { setMode("view"); message.success("Cập nhật tài khoản thành công") });
    else handleCreateUserSubmit(fd).then(() => { setMode("view"); message.success("Tạo tài khoản thành công") });
  };

  const onSubmitRole = (values: any, isEdit: boolean) => {
    const fd = new FormData();
    if (isEdit) fd.append("roleProfileId", selectedRoleId);
    if (values.name) fd.append("name", values.name);
    if (values.code) fd.append("code", values.code);
    if (values.description) fd.append("description", values.description);
    if (values.baseRole) fd.append("baseRole", values.baseRole);
    if (values.isActive) fd.append("isActive", "on");
    
    if (values.permissions) {
      values.permissions.forEach((p: string) => fd.append("permissions", p));
    }

    if (isEdit) handleUpdateRoleSubmit(fd).then(() => { setMode("view"); message.success("Cập nhật vai trò thành công") });
    else handleCreateRoleSubmit(fd).then(() => { setMode("view"); message.success("Tạo vai trò thành công") });
  };

  const onSubmitImport = (values: any) => {
    const fd = new FormData();
    if (values.file?.fileList?.[0]?.originFileObj) {
      fd.append("file", values.file.fileList[0].originFileObj);
    }
    handleImportSubmit(fd);
  };

  const roleOptions = roleProfiles
    .filter((r: any) => r.isActive || r.id === editRoleProfileId)
    .map((r: any) => ({
      value: r.id,
      label: `${r.name}${!r.isActive ? " (đã khóa)" : ""}`
    }));

  const baseRoleOptions = (Object.keys(systemRoleLabels) as any[]).map(role => ({
    value: role,
    label: systemRoleLabels[role as keyof typeof systemRoleLabels],
  }));

  const permissionOptions = permissionGroups.map(group => ({
    label: group.title,
    options: group.permissions.map(p => ({ label: permissionLabels[p], value: p }))
  }));

  return (
    <div className="flex h-full w-full flex-col bg-vin-root font-sans text-vin-text">
      <div className="flex-none border-b border-vin-border/70 px-4 py-3 bg-vin-shell">
        <div className="flex items-center justify-between">
          <ScreenHeader />
          <div className="flex gap-2">
            <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() => { setErrorMessage(""); setImportResults(null); setMode("importUsers"); }}
            >
              Import (Dry-run)
            </Button>
            <Button
              type="primary"
              icon={activeTab === "users" ? <UserOutlined /> : <SafetyOutlined />}
              onClick={() => {
                setErrorMessage("");
                if (activeTab === "users") {
                  setMode("createUser");
                  setSelectedUserId(null);
                  formUserCreate.resetFields();
                  formUserCreate.setFieldsValue({ roleProfileId: defaultRoleProfileId, isSigningDoctor: true });
                } else {
                  setMode("createRole");
                  setSelectedRoleId(null);
                  formRoleCreate.resetFields();
                  formRoleCreate.setFieldsValue({ baseRole: "RECEPTION", isActive: true, permissions: ["archive.read"] });
                }
              }}
            >
              {activeTab === "users" ? "Tạo tài khoản" : "Tạo vai trò"}
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Input.Search
            placeholder={activeTab === "users" ? "Tìm username, họ tên, vai trò..." : "Tìm tên vai trò, mã, quyền..."}
            allowClear
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
            className="w-80"
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setMode("view");
            setSelectedUserId(null);
            setSelectedRoleId(null);
          }}
          items={[
            {
              key: "users",
              label: "Người dùng",
              children: (
                <UsersDataGrid
                  rows={filteredUsers}
                  isLoading={isLoading}
                  selectedId={selectedUserId}
                  onSelect={(id: string) => {
                    setSelectedUserId(id);
                    setMode("view");
                    const user = users.find((u: any) => u.id === id);
                    if (user) {
                      formUserEdit.setFieldsValue({
                        fullName: user.fullName,
                        roleProfileId: user.roleProfileId || defaultRoleProfileId,
                        isActive: user.isActive,
                        title: user.doctorProfile?.title || "",
                        specialty: user.doctorProfile?.specialty || "",
                        licenseNumber: user.doctorProfile?.licenseNumber || "",
                        isSigningDoctor: user.doctorProfile?.isSigningDoctor ?? true
                      });
                      setEditRoleProfileId(user.roleProfileId);
                    }
                  }}
                />
              )
            },
            {
              key: "roles",
              label: "Vai trò & quyền",
              children: (
                <RolesDataGrid
                  rows={filteredRoles}
                  isLoading={isLoading}
                  selectedId={selectedRoleId}
                  onSelect={(id: string) => {
                    setSelectedRoleId(id);
                    setMode("view");
                    const role = roleProfiles.find((r: any) => r.id === id);
                    if (role) {
                      formRoleEdit.setFieldsValue({
                        name: role.name,
                        description: role.description,
                        baseRole: role.baseRole,
                        isActive: role.isActive,
                        permissions: role.permissions
                      });
                    }
                  }}
                />
              )
            }
          ]}
        />
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        title="Tạo tài khoản mới"
        open={mode === "createUser"}
        onCancel={() => setMode("view")}
        onOk={() => formUserCreate.submit()}
        confirmLoading={isSaving}
        width={700}
        destroyOnClose
      >
        {errorMessage && <Alert message={errorMessage} type="error" showIcon className="mb-4" />}
        <Form form={formUserCreate} layout="vertical" onFinish={(vals) => onSubmitUser(vals, false)}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="roleProfileId" label="Vai trò" rules={[{ required: true }]}>
              <Select options={roleOptions} onChange={(val) => setCreateRoleProfileId(val)} />
            </Form.Item>
          </div>
          {/* Doctor Profile section inside form */}
          {createUserIsDoctor && (
            <div className="border border-vin-border p-3 rounded mt-2">
              <div className="font-bold mb-2">Hồ sơ bác sĩ</div>
              <div className="grid grid-cols-3 gap-3">
                <Form.Item name="title" label="Chức danh"><Input /></Form.Item>
                <Form.Item name="specialty" label="Chuyên khoa"><Input /></Form.Item>
                <Form.Item name="licenseNumber" label="Số CCHN"><Input /></Form.Item>
              </div>
              <Form.Item name="isSigningDoctor" valuePropName="checked">
                <Checkbox>Bác sĩ ký phiếu</Checkbox>
              </Form.Item>
              <Form.Item name="signature" label="Chữ ký scan">
                <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                  <Button icon={<UploadOutlined />}>Chọn file</Button>
                </Upload>
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        title={`Chỉnh sửa: ${selectedUser?.username}`}
        open={mode === "view" && activeTab === "users" && selectedUserId !== null}
        onCancel={() => { setMode("view"); setSelectedUserId(null); }}
        onOk={() => formUserEdit.submit()}
        confirmLoading={isSaving}
        width={700}
        destroyOnClose
      >
        {errorMessage && <Alert message={errorMessage} type="error" showIcon className="mb-4" />}
        <Form form={formUserEdit} layout="vertical" onFinish={(vals) => onSubmitUser(vals, true)}>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="roleProfileId" label="Vai trò">
              <Select options={roleOptions} onChange={(val) => setEditRoleProfileId(val)} />
            </Form.Item>
            <Form.Item name="password" label="Đổi mật khẩu">
              <Input.Password placeholder="Bỏ trống nếu không đổi" />
            </Form.Item>
          </div>
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Cho phép đăng nhập</Checkbox>
          </Form.Item>
          
          {editUserIsDoctor && (
            <div className="border border-vin-border p-3 rounded mt-2">
              <div className="font-bold mb-2">Hồ sơ bác sĩ</div>
              <div className="grid grid-cols-3 gap-3">
                <Form.Item name="title" label="Chức danh"><Input /></Form.Item>
                <Form.Item name="specialty" label="Chuyên khoa"><Input /></Form.Item>
                <Form.Item name="licenseNumber" label="Số CCHN"><Input /></Form.Item>
              </div>
              <Form.Item name="isSigningDoctor" valuePropName="checked">
                <Checkbox>Bác sĩ ký phiếu</Checkbox>
              </Form.Item>
              <Form.Item name="signature" label="Chữ ký scan">
                <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                  <Button icon={<UploadOutlined />}>Chọn file mới (Ghi đè)</Button>
                </Upload>
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>

      {/* CREATE ROLE MODAL */}
      <Modal
        title="Tạo vai trò mới"
        open={mode === "createRole"}
        onCancel={() => setMode("view")}
        onOk={() => formRoleCreate.submit()}
        confirmLoading={isSaving}
        width={800}
        destroyOnClose
      >
        {errorMessage && <Alert message={errorMessage} type="error" showIcon className="mb-4" />}
        <Form form={formRoleCreate} layout="vertical" onFinish={(vals) => onSubmitRole(vals, false)}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Tên vai trò" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label="Mã vai trò">
              <Input placeholder="Tự sinh nếu để trống" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="baseRole" label="Nhóm gốc" rules={[{ required: true }]}>
              <Select options={baseRoleOptions} />
            </Form.Item>
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox>Cho phép sử dụng</Checkbox>
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="permissions" label="Quyền hạn">
            <Checkbox.Group className="w-full">
              <div className="grid grid-cols-2 gap-4">
                {permissionOptions.map(group => (
                  <div key={group.label} className="border border-vin-border p-2 rounded">
                    <div className="font-bold text-sm uppercase text-vin-muted mb-2">{group.label}</div>
                    <div className="flex flex-col gap-1">
                      {group.options.map(opt => (
                        <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT ROLE MODAL */}
      <Modal
        title={`Chỉnh sửa vai trò: ${selectedRole?.name}`}
        open={mode === "view" && activeTab === "roles" && selectedRoleId !== null}
        onCancel={() => { setMode("view"); setSelectedRoleId(null); }}
        onOk={() => formRoleEdit.submit()}
        confirmLoading={isSaving}
        width={800}
        destroyOnClose
      >
        {errorMessage && <Alert message={errorMessage} type="error" showIcon className="mb-4" />}
        <Form form={formRoleEdit} layout="vertical" onFinish={(vals) => onSubmitRole(vals, true)}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Tên vai trò" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Mã vai trò">
              <Input value={selectedRole?.code} disabled />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="baseRole" label="Nhóm gốc">
              <Select options={baseRoleOptions} disabled={selectedRole?.isSystem} />
            </Form.Item>
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox disabled={selectedRole?.isSystem}>Cho phép sử dụng</Checkbox>
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="permissions" label="Quyền hạn">
            <Checkbox.Group className="w-full" disabled={selectedRole?.isSystem}>
              <div className="grid grid-cols-2 gap-4">
                {permissionOptions.map(group => (
                  <div key={group.label} className="border border-vin-border p-2 rounded">
                    <div className="font-bold text-sm uppercase text-vin-muted mb-2">{group.label}</div>
                    <div className="flex flex-col gap-1">
                      {group.options.map(opt => (
                        <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal
        title="Kiểm tra import tài khoản"
        open={mode === "importUsers"}
        onCancel={() => setMode("view")}
        onOk={() => formImport.submit()}
        confirmLoading={isSaving}
        width={800}
        destroyOnClose
      >
        {errorMessage && <Alert message={errorMessage} type="error" showIcon className="mb-4" />}
        <Form form={formImport} layout="vertical" onFinish={onSubmitImport}>
          <Form.Item name="file" label="File CSV" rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".csv">
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>
          <div className="text-sm text-vin-muted mb-4">Cấu trúc: username, fullname, role (Mã hoặc Tên). Có dòng tiêu đề.</div>
        </Form>

        {importResults && (
          <div className="mt-4 pt-4 border-t border-vin-border">
            <div className="mb-3">
              <span className="text-emerald-500 font-bold mr-4">Hợp lệ: {importResults.successCount}</span>
              <span className="text-red-500 font-bold">Lỗi: {importResults.errorCount}</span>
            </div>
            <ImportPreviewGrid rows={importResults.results} />
          </div>
        )}
      </Modal>

    </div>
  );
}
