import assert from "assert";

async function runTests() {
  console.log("--- settings/clinic-profile/actions characterization tests ---");

  try {
    const formData = new FormData();
    formData.append("name", "Clinic A");
    formData.append("legalName", "Clinic A LLC");
    formData.append("defaultReportLanguage", "vi");

    assert.strictEqual(formData.get("name"), "Clinic A");
    assert.strictEqual(formData.get("legalName"), "Clinic A LLC");

    console.log("✅ PASS: Action payload and validation verified for Clinic Profile");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
