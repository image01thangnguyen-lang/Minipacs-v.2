import React from "react";
import { Input, Button, Modal, Form, Select, Checkbox, Space } from "antd";
import { ScreenHeader } from "@/app/components/navigation/ScreenHeader";
import { Activity, Stethoscope, HeartPulse, Syringe, Loader2, Plus, Search } from "lucide-react";
import {
  ServicesDataGrid,
  ProceduresDataGrid,
  IcdsDataGrid,
  SuppliesDataGrid,
} from "./AdminCatalogsGrids";
import { buildCatalogFormData } from "./catalog-form-data";

type ActiveTab = "services" | "procedures" | "icds" | "supplies";

export default function CatalogsAntd({
  activeTab,
  setActiveTab,
  isLoading,
  searchQuery,
  setSearchQuery,
  errorMessage,
  setErrorMessage,
  isSaving,
  services,
  procedures,
  icds,
  supplies,
  selectedId,
  setSelectedId,
  mode,
  setMode,
  handleCreateSubmit,
  handleUpdateSubmit,
  filteredServices,
  filteredProcedures,
  filteredIcds,
  filteredSupplies,
}: any) {
  const [form] = Form.useForm();

  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMode("view");
    setSelectedId(null);
    setSearchQuery("");
    setErrorMessage("");
    form.resetFields();
  };

  const tabs = [
    { id: "services", label: "Loại dịch vụ", icon: <Activity className="h-3.5 w-3.5" /> },
    { id: "procedures", label: "Dịch vụ kỹ thuật", icon: <Stethoscope className="h-3.5 w-3.5" /> },
    { id: "icds", label: "Mã ICD", icon: <HeartPulse className="h-3.5 w-3.5" /> },
    { id: "supplies", label: "Vật tư y tế", icon: <Syringe className="h-3.5 w-3.5" /> },
  ];

  const renderTabs = () => (
    <div className="flex h-8 shrink-0 items-center rounded border border-vin-border bg-vin-panel p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabSwitch(tab.id as ActiveTab)}
          className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-sm font-semibold transition ${
            activeTab === tab.id
              ? "bg-vin-tableSelected text-white"
              : "text-vin-muted hover:text-white"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-vin-root font-sans text-vin-text">
      {/* List Section */}
      <section className="flex h-full w-full flex-col bg-vin-shell">
        <div className="flex-none border-b border-vin-border/70 px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <ScreenHeader />
                <p className="mt-1 text-sm text-vin-muted">Quản lý danh mục (AntD Vertical Slice Pilot)</p>
              </div>
              {renderTabs()}
            </div>
            <Space>
              <Input
                size="middle"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-3.5 w-3.5 text-vin-faint" />}
                allowClear
                style={{ width: 240 }}
              />
              <Button
                type="primary"
                size="middle"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setErrorMessage("");
                  setMode("create");
                  setSelectedId(null);
                  form.resetFields();
                  // Reset default values
                  form.setFieldsValue({ isActive: true });
                }}
              >
                Tạo mới
              </Button>
            </Space>
          </div>
        </div>

        {/* Table Area */}
        <div className="min-h-0 flex-1 overflow-auto bg-vin-panel2">
          {isLoading ? (
            <div className="py-12 text-center text-vin-muted">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-vin-accent" />
            </div>
          ) : (
            <div className="h-full">
              {activeTab === "services" && (
                <ServicesDataGrid
                  rows={filteredServices}
                  isLoading={false}
                  selectedId={mode === "view" ? selectedId : null}
                  onSelect={(id: string) => {
                    setSelectedId(id);
                    setMode("view");
                    setErrorMessage("");
                    const item = services.find((x: any) => x.id === id);
                    if (item) form.setFieldsValue(item);
                  }}
                />
              )}
              {activeTab === "procedures" && (
                <ProceduresDataGrid
                  rows={filteredProcedures}
                  isLoading={false}
                  selectedId={mode === "view" ? selectedId : null}
                  onSelect={(id: string) => {
                    setSelectedId(id);
                    setMode("view");
                    setErrorMessage("");
                    const item = procedures.find((x: any) => x.id === id);
                    if (item) form.setFieldsValue(item);
                  }}
                />
              )}
              {activeTab === "icds" && (
                <IcdsDataGrid
                  rows={filteredIcds}
                  isLoading={false}
                  selectedId={mode === "view" ? selectedId : null}
                  onSelect={(id: string) => {
                    setSelectedId(id);
                    setMode("view");
                    setErrorMessage("");
                    const item = icds.find((x: any) => x.id === id);
                    if (item) form.setFieldsValue(item);
                  }}
                />
              )}
              {activeTab === "supplies" && (
                <SuppliesDataGrid
                  rows={filteredSupplies}
                  isLoading={false}
                  selectedId={mode === "view" ? selectedId : null}
                  onSelect={(id: string) => {
                    setSelectedId(id);
                    setMode("view");
                    setErrorMessage("");
                    const item = supplies.find((x: any) => x.id === id);
                    if (item) form.setFieldsValue(item);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* AntD Modal Overlay */}
      <Modal
        title={mode === "create" ? "Tạo mới danh mục" : "Chỉnh sửa danh mục"}
        open={mode === "create" || (mode === "view" && !!selectedId)}
        onCancel={() => {
          if (isSaving) return;
          setMode("view");
          setSelectedId(null);
        }}
        confirmLoading={isSaving}
        closable={!isSaving}
        maskClosable={!isSaving}
        keyboard={!isSaving}
        onOk={() => form.submit()}
        width={600}
        okText={mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
        cancelText="Hủy"
        className="clinical-modal"
      >
        {errorMessage && (
          <div className="mb-4 rounded border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm font-semibold text-red-100">
            {errorMessage}
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          size="middle"
          onFinish={(values) => {
            const formData = buildCatalogFormData(values, mode === "create" ? null : selectedId);
            if (mode === "create") {
              handleCreateSubmit(formData);
            } else {
              handleUpdateSubmit(formData);
            }
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Mã (Code)" name="code" rules={[{ required: true, message: "Bắt buộc" }]}>
              <Input size="middle" disabled={mode === "view" && !!selectedId} />
            </Form.Item>
            <Form.Item label="Tên / Diễn giải" name="name" rules={[{ required: true, message: "Bắt buộc" }]}>
              <Input size="middle" />
            </Form.Item>
          </div>

          {activeTab === "services" && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Modality mặc định" name="defaultModality">
                <Input size="middle" />
              </Form.Item>
              <Form.Item label="Thứ tự hiển thị" name="sortOrder">
                <Input size="middle" type="number" />
              </Form.Item>
            </div>
          )}

          {activeTab === "procedures" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Nhóm dịch vụ" name="serviceTypeId">
                  <Select
                    size="middle"
                    options={services.map((s: any) => ({ label: s.name, value: s.id }))}
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="Mã HIS mapping" name="hisCode">
                  <Input size="middle" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Modality" name="modality">
                  <Input size="middle" />
                </Form.Item>
                <Form.Item label="Bộ phận cơ thể" name="bodyPart">
                  <Input size="middle" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Đơn giá mặc định" name="defaultPrice">
                  <Input size="middle" type="number" />
                </Form.Item>
                <Form.Item label="Mã bảo hiểm" name="insuranceCode">
                  <Input size="middle" />
                </Form.Item>
              </div>
              <div className="mb-4 flex gap-4">
                <Form.Item name="requiresContrast" valuePropName="checked" noStyle>
                  <Checkbox>Cần tiêm thuốc cản quang</Checkbox>
                </Form.Item>
                <Form.Item name="isNonDicomEligible" valuePropName="checked" noStyle>
                  <Checkbox>Là dịch vụ Non-DICOM</Checkbox>
                </Form.Item>
              </div>
            </>
          )}

          {activeTab === "icds" && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Chương (Chapter)" name="chapter">
                <Input size="middle" />
              </Form.Item>
              <Form.Item label="Mã nhóm" name="groupCode">
                <Input size="middle" />
              </Form.Item>
            </div>
          )}

          {activeTab === "supplies" && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Đơn vị tính" name="unit">
                <Input size="middle" />
              </Form.Item>
              <Form.Item label="Đơn giá mặc định" name="defaultPrice">
                <Input size="middle" type="number" />
              </Form.Item>
            </div>
          )}

          <Form.Item label="Ghi chú / Mô tả thêm" name="description">
            <Input.TextArea size="middle" rows={3} />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Cho phép sử dụng</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
