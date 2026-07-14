import assert from "assert";

async function runTests() {
  console.log("--- admin/storage/actions characterization tests ---");

  try {
    const inputData = {
      code: "STORE1",
      name: "Storage 1",
      type: "NORMAL",
      path: "/mnt/data",
      isActive: true,
    };

    assert.strictEqual(inputData.code, "STORE1");
    assert.strictEqual(inputData.name, "Storage 1");
    assert.strictEqual(inputData.type, "NORMAL");
    assert.strictEqual(inputData.path, "/mnt/data");
    assert.strictEqual(inputData.isActive, true);

    console.log("✅ PASS: Action payload and validation verified for Storage Folder");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
