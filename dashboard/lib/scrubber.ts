/**
 * Utility to scrub sensitive information (PHI, secrets, raw paths) 
 * from diagnostic, health, and security outputs before logging or returning to UI.
 */

export function scrubDiagnosticOutput(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return scrubString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => scrubDiagnosticOutput(item));
  }

  if (typeof data === 'object') {
    const scrubbed: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      
      // Mask known sensitive keys entirely
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key')
      ) {
        // Skip some keys that might be just IDs like "checkKey", "findingKey", etc.
        if (!lowerKey.endsWith('id') && !['checkkey', 'findingkey', 'testkey', 'stepkey', 'actionkey'].includes(lowerKey)) {
          scrubbed[key] = '***SCRUBBED_SECRET***';
          continue;
        }
      }

      // Mask known PHI keys entirely
      if (
        lowerKey === 'patientname' ||
        lowerKey === 'patientid' ||
        lowerKey === 'patientbirthdate' ||
        lowerKey === 'patientsex' ||
        lowerKey.includes('phi')
      ) {
        scrubbed[key] = '***SCRUBBED_PHI***';
        continue;
      }

      // Mask Raw HIS payloads entirely
      if (lowerKey.includes('hispayload') || lowerKey.includes('rawhl7')) {
        scrubbed[key] = '***SCRUBBED_HIS_PAYLOAD***';
        continue;
      }

      // Mask DICOM payloads
      if (lowerKey.includes('dicompayload') || lowerKey.includes('rawdicom')) {
        scrubbed[key] = '***SCRUBBED_DICOM_PAYLOAD***';
        continue;
      }

      scrubbed[key] = scrubDiagnosticOutput(data[key]);
    }
    return scrubbed;
  }

  return data;
}

function scrubString(str: string): string {
  let scrubbed = str;

  // 1. Scrub common token patterns (Bearer tokens, JWTs)
  scrubbed = scrubbed.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer ***SCRUBBED_TOKEN***');
  scrubbed = scrubbed.replace(/eyJ[a-zA-Z0-9\-\._~\+\/]+/g, '***SCRUBBED_JWT***');

  // 2. Scrub Windows/Linux filesystem paths (basic heuristic to prevent path disclosure)
  // Replaces C:\something\else or /var/lib/something with ***SCRUBBED_PATH***
  // Be careful not to scrub simple URLs
  scrubbed = scrubbed.replace(/[A-Z]:\\[a-zA-Z0-9\\\-_.\s]+/g, '***SCRUBBED_PATH***');
  // Match absolute linux paths, avoiding replacing /api/xyz
  // We'll be conservative and just look for /var/lib, /etc, /root, /opt
  scrubbed = scrubbed.replace(/(\/var\/lib|\/etc|\/root|\/opt)[a-zA-Z0-9\/\-_.]+/g, '***SCRUBBED_PATH***');

  // 3. Scrub potential passwords in URLs (e.g., postgres://user:password@host)
  scrubbed = scrubbed.replace(/(:\/\/[^\/:]+:)([^@]+)(@)/g, '$1***SCRUBBED_PASS***$3');

  return scrubbed;
}
