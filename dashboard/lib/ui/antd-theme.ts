import { theme, type ThemeConfig } from "antd";

export const clinicalTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  token: {
    colorPrimary: "#13C2C2",
    colorInfo: "#13C2C2",
    colorSuccess: "#389E0D",
    colorWarning: "#D48806",
    colorError: "#CF1322",
    colorBgBase: "#141414",
    colorBgContainer: "#1F1F1F",
    colorBgElevated: "#262626",
    colorTextBase: "#E0E0E0",
    colorTextSecondary: "#8C8C8C",
    colorBorder: "#303030",
    borderRadius: 2,
    controlHeight: 24,
    fontSize: 12,
    marginXXS: 2,
    marginXS: 4,
    marginSM: 8,
    paddingXXS: 2,
    paddingXS: 4,
    paddingSM: 8,
  },
  components: {
    Table: {
      headerBg: "#1F1F1F",
      headerColor: "#E0E0E0",
      borderColor: "#303030",
      cellPaddingBlockSM: 2,
      cellPaddingInlineSM: 4,
    },
  },
};
