import assert from "assert";
import { theme } from "antd";
import { clinicalTheme } from "../antd-theme";

async function runTests() {
  console.log("--- clinicalTheme Tests ---");

  try {
    assert.strictEqual(clinicalTheme.algorithm, theme.darkAlgorithm);
    console.log("✅ PASS: uses the standard-density dark algorithm");
  } catch (e: any) {
    console.error("❌ FAIL: algorithms", e.message);
    process.exit(1);
  }

  try {
    assert.deepStrictEqual(clinicalTheme.token, {
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
      controlHeight: 32,
      fontSize: 14,
    });
    console.log("✅ PASS: applies mandatory design tokens");
  } catch (e: any) {
    console.error("❌ FAIL: mandatory tokens", e.message);
    process.exit(1);
  }

  try {
    const tableTokens = clinicalTheme.components?.Table;
    assert.ok(tableTokens, "Table tokens should be defined");
    assert.deepStrictEqual(tableTokens, {
      headerBg: "#1F1F1F",
      headerColor: "#E0E0E0",
      borderColor: "#303030",
    });
    console.log("✅ PASS: applies mandatory component overrides");
  } catch (e: any) {
    console.error("❌ FAIL: table overrides", e.message);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
