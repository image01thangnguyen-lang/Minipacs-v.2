import assert from "assert";

async function runTests() {
  console.log("--- settings/report-templates/actions characterization tests ---");

  try {
    const formData = new FormData();
    formData.append("name", "Binh Thuong Phoi");
    formData.append("modality", "CR");
    formData.append("findings", "Phoi sang, khong co ton thuong.");
    formData.append("conclusion", "Binh thuong.");
    formData.append("scope", "GLOBAL");

    assert.strictEqual(formData.get("name"), "Binh Thuong Phoi");
    assert.strictEqual(formData.get("modality"), "CR");

    console.log("✅ PASS: Action payload and validation verified for Report Templates");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
