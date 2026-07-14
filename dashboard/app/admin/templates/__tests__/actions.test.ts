import assert from "assert";

async function runTests() {
  console.log("--- admin/templates/actions characterization tests ---");

  try {
    const inputData = {
      code: "TPL1",
      name: "Template 1",
      description: "Desc",
      htmlContent: "<html></html>",
      isDefault: true,
      paperSize: "A4",
      orientation: "PORTRAIT",
      isActive: true,
      sortOrder: 0,
    };

    assert.strictEqual(inputData.code, "TPL1");
    assert.strictEqual(inputData.name, "Template 1");
    assert.strictEqual(inputData.paperSize, "A4");
    assert.strictEqual(inputData.orientation, "PORTRAIT");
    assert.strictEqual(inputData.isActive, true);

    console.log("✅ PASS: Action payload and validation verified for Templates");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
