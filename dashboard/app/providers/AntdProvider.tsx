"use client";

import React from "react";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import { clinicalTheme } from "../../lib/ui/antd-theme";

export function getClinicalPopupContainer(): HTMLElement {
  // Split panes and scroll regions may clip descendants. Body is the safe
  // default until a scoped portal has explicit overflow and z-index tests.
  return document.body;
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={clinicalTheme}
      componentSize="middle"
      locale={viVN}
      getPopupContainer={getClinicalPopupContainer}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
