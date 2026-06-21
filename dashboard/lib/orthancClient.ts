import { Buffer } from "buffer";

export class OrthancError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "OrthancError";
  }
}

function getOrthancConfig() {
  return {
    url: process.env.ORTHANC_API_URL || "http://orthanc:8042",
    username: process.env.ORTHANC_USERNAME || "admin",
    password: process.env.ORTHANC_PASSWORD || "admin_password",
  };
}

async function orthancFetch(endpoint: string, options: RequestInit = {}) {
  const { url, username, password } = getOrthancConfig();
  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  const response = await fetch(`${url}${endpoint}`, {
    ...options,
    headers: {
      Authorization: auth,
      Accept: "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData && errorData.Message) {
        message = errorData.Message;
      }
    } catch (e) {
      // Ignore
    }
    throw new OrthancError(`Orthanc API Error: ${message}`, response.status);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export type DicomModalityConfig = {
  AET: string;
  Host: string;
  Port: number;
  Manufacturer?: string;
  AllowEcho?: boolean;
  AllowFind?: boolean;
  AllowMove?: boolean;
  AllowStore?: boolean;
  AllowStorageCommitment?: boolean;
  AllowTranscoding?: boolean;
};

export type OrthancSystemInfo = {
  ApiVersion?: number;
  DatabaseBackendPlugin?: string | null;
  DatabaseVersion?: number;
  DicomAet?: string;
  DicomPort?: number;
  HttpPort?: number;
  Name?: string;
  Version?: string;
};

export type OrthancStatistics = {
  CountInstances?: number;
  CountPatients?: number;
  CountSeries?: number;
  CountStudies?: number;
  TotalDiskSize?: string | number;
  TotalDiskSizeMB?: number;
  TotalUncompressedSize?: string | number;
  TotalUncompressedSizeMB?: number;
};

export const orthancClient = {
  async getSystem(): Promise<OrthancSystemInfo> {
    return orthancFetch("/system");
  },

  async getStatistics(): Promise<OrthancStatistics> {
    return orthancFetch("/statistics");
  },

  /**
   * Lấy danh sách tất cả các Dicom Modalities
   */
  async getModalities(): Promise<string[]> {
    return orthancFetch("/modalities");
  },

  /**
   * Lấy cấu hình của một Dicom Modality
   */
  async getModality(alias: string): Promise<DicomModalityConfig | any[]> {
    return orthancFetch(`/modalities/${encodeURIComponent(alias)}`);
  },

  /**
   * Thêm hoặc cập nhật một Dicom Modality
   */
  async putModality(alias: string, config: DicomModalityConfig) {
    return orthancFetch(`/modalities/${encodeURIComponent(alias)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
  },

  /**
   * Xóa một Dicom Modality
   */
  async deleteModality(alias: string) {
    return orthancFetch(`/modalities/${encodeURIComponent(alias)}`, {
      method: "DELETE",
    });
  },

  /**
   * Thực hiện lệnh C-Echo đến một Dicom Modality
   */
  async pingModality(alias: string) {
    return orthancFetch(`/modalities/${encodeURIComponent(alias)}/echo`, {
      method: "POST",
    });
  },
};
