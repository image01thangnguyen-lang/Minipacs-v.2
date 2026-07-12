import { scrubDiagnosticOutput } from "../scrubber";

type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  eventName: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Standardized logger for application events.
 * Guarantees that all payloads are scrubbed for PHI and secrets before emission.
 */
export const logger = {
  logEvent: (level: LogLevel, payload: LogPayload): void => {
    // Scrub sensitive data before serialization
    const scrubbedPayload = scrubDiagnosticOutput(payload) as Record<string, unknown>;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      ...scrubbedPayload,
    };

    // Output to stdout as JSON for log collectors (e.g., Datadog Agent, FluentBit)
    let logString: string;
    try {
      logString = JSON.stringify(logEntry);
    } catch {
      // Logging must never break the request path, even for cyclic/unsupported input.
      logString = JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        eventName: "LOG_SERIALIZATION_FAILED",
      });
    }

    switch (level) {
      case "info":
      case "debug":
        console.log(logString);
        break;
      case "warn":
        console.warn(logString);
        break;
      case "error":
        console.error(logString);
        break;
    }
  },

  info: (eventName: string, payload: Omit<LogPayload, "eventName"> = {}) => {
    logger.logEvent("info", { eventName, ...payload });
  },

  warn: (eventName: string, payload: Omit<LogPayload, "eventName"> = {}) => {
    logger.logEvent("warn", { eventName, ...payload });
  },

  error: (eventName: string, payload: Omit<LogPayload, "eventName"> = {}) => {
    logger.logEvent("error", { eventName, ...payload });
  },
};
