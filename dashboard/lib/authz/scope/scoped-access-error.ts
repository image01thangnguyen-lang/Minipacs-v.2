/**
 * Typed error for scoped access denials.
 *
 * Contains only technical metadata safe for logging.
 * Never exposes PHI, grant IDs, tree internals, or resource existence.
 */

export type ScopedAccessErrorCode =
  | "SCOPE_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "PREREQUISITE_DENIED";

export class ScopedAccessError extends Error {
  readonly code: ScopedAccessErrorCode;
  readonly capability: string;
  readonly reasonCode: string;

  constructor(opts: {
    code: ScopedAccessErrorCode;
    capability: string;
    reasonCode: string;
    message?: string;
  }) {
    super(opts.message || "Not found or access denied");
    this.name = "ScopedAccessError";
    this.code = opts.code;
    this.capability = opts.capability;
    this.reasonCode = opts.reasonCode;
  }
}

/**
 * Convert any error to a safe boundary response for client.
 * Never leaks resource existence, PHI, or grant internals.
 */
export function toScopedErrorResponse(err: unknown): { success: false; error: string } {
  if (err instanceof ScopedAccessError) {
    return { success: false, error: "Not found or access denied" };
  }
  if (err instanceof Error) {
    return { success: false, error: err.message };
  }
  return { success: false, error: "Unknown error" };
}

/**
 * Convert to a NextResponse-compatible JSON body for API routes.
 */
export function toScopedApiError(err: unknown): { status: number; body: { error: string } } {
  if (err instanceof ScopedAccessError) {
    return { status: 404, body: { error: "Not found or access denied" } };
  }
  if (err instanceof Error) {
    return { status: 500, body: { error: err.message } };
  }
  return { status: 500, body: { error: "Unknown error" } };
}
