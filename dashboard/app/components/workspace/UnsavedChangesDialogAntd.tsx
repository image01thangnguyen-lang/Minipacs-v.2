"use client";

import React, { useState } from "react";
import { Modal, Button, Typography, Alert } from "antd";
import { useWorkspaceDirty } from "./hooks/WorkspaceDirtyContext";

const { Text } = Typography;

export function UnsavedChangesDialogAntd() {
  const { pendingAction, resolvePendingAction, setDirty, executeSave } = useWorkspaceDirty();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!pendingAction) return null;

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const success = await executeSave();
      if (success) {
        setDirty(false);
        resolvePendingAction(true); // proceed
      } else {
        setSaveError("Không thể lưu bản nháp. Vui lòng xử lý lỗi lưu hoặc tiếp tục chỉnh sửa.");
      }
    } catch {
      setSaveError("Không thể lưu bản nháp. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setSaveError(null);
    setDirty(false);
    resolvePendingAction(true); // proceed
  };

  const handleCancel = () => {
    setSaveError(null);
    resolvePendingAction(false); // cancel navigation
  };

  return (
    <Modal
      open={!!pendingAction}
      title={<span style={{ color: '#E5E7EB' }}>Bạn có thay đổi chưa lưu</span>}
      closable={false}
      maskClosable={false}
      keyboard={!isSaving}
      onCancel={(e) => {
        // Only trigger on ESC key
        if ((e as any).type === "keydown") {
          handleCancel();
        }
      }}
      footer={[
        <Button key="cancel" disabled={isSaving} onClick={handleCancel}>
          Tiếp tục chỉnh sửa
        </Button>,
        <Button key="discard" danger disabled={isSaving} onClick={handleDiscard}>
          Bỏ qua thay đổi
        </Button>,
        <Button key="save" type="primary" loading={isSaving} onClick={handleSaveAndContinue}>
          Lưu và tiếp tục
        </Button>,
      ]}
      className="dark-modal" // Assume global style or inline overrides below
      styles={{
        content: { backgroundColor: '#141414', border: '1px solid #303030' },
        header: { backgroundColor: '#141414', borderBottom: 'none' },
        footer: { borderTop: 'none' }
      }}
    >
      <Text className="text-gray-400">
        Bản nháp của bạn chứa các thay đổi chưa được lưu vào hệ thống. Bạn muốn xử lý thế nào trước khi rời đi?
      </Text>
      
      {saveError && (
        <Alert
          type="error"
          message={saveError}
          className="mt-4 border-red-500/50 bg-red-500/10 text-red-400"
          showIcon
        />
      )}
    </Modal>
  );
}
