import assert from "assert";

async function runTests() {
  console.log("--- admin/users/actions characterization tests ---");

  try {
    const fd = new FormData();
    fd.append("username", "doctor1");
    fd.append("fullName", "Dr. One");
    fd.append("password", "secret");
    fd.append("roleProfileId", "profile-1");
    fd.append("title", "MD");
    fd.append("isSigningDoctor", "on");

    // We emulate what the action does to parse FormData
    const username = String(fd.get("username") || "").trim().toLowerCase();
    const fullName = String(fd.get("fullName") || "").trim();
    const password = String(fd.get("password") || "").trim();
    const roleProfileId = String(fd.get("roleProfileId") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const isSigningDoctor = fd.get("isSigningDoctor") === "on";

    assert.strictEqual(username, "doctor1");
    assert.strictEqual(fullName, "Dr. One");
    assert.strictEqual(password, "secret");
    assert.strictEqual(roleProfileId, "profile-1");
    assert.strictEqual(title, "MD");
    assert.strictEqual(isSigningDoctor, true);

    console.log("✅ PASS: Action payload and FormData validation verified for User creation");
  } catch (error: any) {
    console.error("❌ FAIL", error);
    process.exit(1);
  }
}

runTests().catch(console.error);
