const SUPPORTED_PROTOCOLS = ["REST", "HL7_V2", "FHIR", "DICOMWEB"] as const;
export type IntegrationProtocol = (typeof SUPPORTED_PROTOCOLS)[number];

export type EndpointRecord = Readonly<{ id: string; name: string; facilityId: string; protocol: string; url: string; secretReference: string | null; version: string; isActive: boolean }>;
type EndpointRepository = Readonly<{
  create(args: { data: Record<string, unknown> }): Promise<EndpointRecord>;
  findUnique(args: { where: { id: string } }): Promise<EndpointRecord | null>;
  findMany(args: { where: { isActive: boolean; facilityId: string }; select: Record<string, boolean> }): Promise<Array<Omit<EndpointRecord, "secretReference" | "isActive">>>;
}>;
export type IntegrationGatewayDependencies = Readonly<{ integrationEndpoint: EndpointRepository; enterpriseInteropEnabled(): boolean }>;

function nonEmpty(value: string, field: string): string { const normalized = value.trim(); if (!normalized) throw new Error(`${field} is required`); return normalized; }
export function validateSecretReference(ref: string): string {
  const normalized = ref.trim();
  if (!/^(vault|aws-ssm|gcp-sm|azure-kv):[A-Za-z0-9][A-Za-z0-9/_.-]{0,510}$/.test(normalized)) throw new Error("INVALID_SECRET_REFERENCE");
  return normalized;
}
function httpsUrl(raw: string): string {
  let url: URL; try { url = new URL(raw); } catch { throw new Error("INVALID_ENDPOINT_URL"); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("HTTPS_ENDPOINT_REQUIRED");
  return url.toString();
}

/** Shadow-only registry. Network probing and activation require an audited adapter. */
export class IntegrationGateway {
  constructor(private readonly deps: IntegrationGatewayDependencies) {}
  private enabled(): void { if (!this.deps.enterpriseInteropEnabled()) throw new Error("ENTERPRISE_INTEROP_DISABLED"); }

  async registerEndpoint(input: Readonly<{ name: string; protocol: IntegrationProtocol; url: string; secretReference?: string; facilityId: string; version?: string }>): Promise<EndpointRecord> {
    this.enabled();
    if (!SUPPORTED_PROTOCOLS.includes(input.protocol)) throw new Error("UNSUPPORTED_PROTOCOL");
    return this.deps.integrationEndpoint.create({ data: {
      name: nonEmpty(input.name, "name"), protocol: input.protocol, url: httpsUrl(input.url),
      secretReference: input.secretReference ? validateSecretReference(input.secretReference) : null,
      facilityId: nonEmpty(input.facilityId, "facilityId"), version: nonEmpty(input.version ?? "1.0", "version"),
      isActive: false,
    } });
  }

  async validateConfiguration(endpointId: string): Promise<{ valid: boolean; code: string }> {
    this.enabled();
    const endpoint = await this.deps.integrationEndpoint.findUnique({ where: { id: endpointId } });
    if (!endpoint) return { valid: false, code: "ENDPOINT_NOT_FOUND" };
    try {
      httpsUrl(endpoint.url); if (endpoint.secretReference) validateSecretReference(endpoint.secretReference);
      if (!SUPPORTED_PROTOCOLS.includes(endpoint.protocol as IntegrationProtocol)) return { valid: false, code: "UNSUPPORTED_PROTOCOL" };
      return { valid: true, code: "CONFIG_VALID_SHADOW_ONLY" };
    } catch (error) { return { valid: false, code: error instanceof Error ? error.message : "INVALID_CONFIGURATION" }; }
  }

  async getActiveEndpoints(facilityId: string) {
    this.enabled();
    return this.deps.integrationEndpoint.findMany({
      where: { isActive: true, facilityId: nonEmpty(facilityId, "facilityId") },
      select: { id: true, name: true, protocol: true, url: true, version: true, facilityId: true },
    });
  }
}