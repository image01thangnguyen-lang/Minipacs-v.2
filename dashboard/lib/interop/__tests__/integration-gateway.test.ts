import assert from "node:assert/strict";
import { IntegrationGateway, validateSecretReference } from "../integration-gateway";
async function main() {
  assert.throws(() => validateSecretReference("plain-password"), /INVALID_SECRET_REFERENCE/);
  assert.equal(validateSecretReference("vault:secret/data/api-key"), "vault:secret/data/api-key");
  let created: any; let queried: any;
  const gateway = new IntegrationGateway({ enterpriseInteropEnabled: () => true, integrationEndpoint: {
    create: async ({ data }) => (created = { id: "ep-1", ...data }),
    findUnique: async () => ({ id: "ep-1", name: "FHIR", facilityId: "f-1", protocol: "FHIR", url: "https://example.test/fhir", secretReference: "vault:fhir/key", version: "R4", isActive: false }),
    findMany: async (args) => { queried = args; return []; },
  } as any });
  await gateway.registerEndpoint({ name: "FHIR", protocol: "FHIR", url: "https://example.test/fhir", secretReference: "vault:fhir/key", facilityId: "f-1" });
  assert.equal(created.isActive, false);
  assert.equal((await gateway.validateConfiguration("ep-1")).code, "CONFIG_VALID_SHADOW_ONLY");
  await gateway.getActiveEndpoints("f-1"); assert.equal(queried.select.secretReference, undefined);
  await assert.rejects(() => new IntegrationGateway({ enterpriseInteropEnabled: () => false, integrationEndpoint: {} as any }).getActiveEndpoints("f-1"), /DISABLED/);
  console.log("integration-gateway tests passed");
}
void main();