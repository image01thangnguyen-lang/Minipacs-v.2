import assert from "assert";
import { dicomNodeSchema } from "../schema";

async function runTests() {
  console.log("--- admin/pacs/nodes/actions characterization tests ---");

  try {
    const inputData = {
      name: "Test Node",
      orthancAlias: "TEST_ALIAS",
      aeTitle: "TEST_AE",
      ipAddress: "192.168.1.1",
      port: 104,
      modality: "CT",
      isActive: true,
      isNonDicom: false
    };

    const parsed = dicomNodeSchema.parse(inputData);

    assert.strictEqual(parsed.name, "Test Node");
    assert.strictEqual(parsed.orthancAlias, "TEST_ALIAS");
    assert.strictEqual(parsed.aeTitle, "TEST_AE");
    assert.strictEqual(parsed.ipAddress, "192.168.1.1");
    assert.strictEqual(parsed.port, 104);
    assert.strictEqual(parsed.modality, "CT");
    assert.strictEqual(parsed.isActive, true);
    assert.strictEqual(parsed.isNonDicom, false);

    console.log("✅ PASS: Action payload and validation verified for Dicom Node");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
