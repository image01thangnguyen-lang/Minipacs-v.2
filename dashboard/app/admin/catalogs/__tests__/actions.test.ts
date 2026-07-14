import assert from "assert";
import { buildCatalogFormData } from "../catalog-form-data";

async function runTests() {
  console.log("--- catalogs/actions characterization tests ---");

  try {
    const fd = buildCatalogFormData({
      code: "M01",
      name: "MRI",
      defaultModality: "MR",
      sortOrder: 10,
      isActive: true,
      requiresContrast: false,
      modality: "MR",
      bodyPart: "HEAD",
      defaultPrice: 1250000,
      insuranceCode: "BH-MR-01",
      optionalValue: null,
    }, "catalog-1");

    assert.strictEqual(fd.get("id"), "catalog-1");
    assert.strictEqual(fd.get("code"), "M01");
    assert.strictEqual(fd.get("name"), "MRI");
    assert.strictEqual(fd.get("defaultModality"), "MR");
    assert.strictEqual(fd.get("sortOrder"), "10");
    assert.strictEqual(fd.get("isActive"), "on");
    assert.strictEqual(fd.get("modality"), "MR");
    assert.strictEqual(fd.get("bodyPart"), "HEAD");
    assert.strictEqual(fd.get("defaultPrice"), "1250000");
    assert.strictEqual(fd.get("insuranceCode"), "BH-MR-01");
    assert.strictEqual(fd.has("requiresContrast"), false);
    assert.strictEqual(fd.has("optionalValue"), false);

    console.log("PASS: AntD values preserve native FormData semantics");

    const createFd = buildCatalogFormData({
      code: "SUP-01",
      name: "Contrast",
      isActive: false,
      description: "",
    });
    assert.strictEqual(createFd.has("id"), false);
    assert.strictEqual(createFd.has("isActive"), false);
    assert.strictEqual(createFd.get("description"), "");
    console.log("PASS: create payload preserves unchecked and empty native form semantics");
  } catch (error: unknown) {
    console.error("FAIL", error);
    process.exitCode = 1;
  }
}

runTests().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
