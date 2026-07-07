export const FACILITY_UNIT_TYPES = [
  "CHAIN",
  "HOSPITAL",
  "DEPARTMENT",
  "SPECIALTY",
  "ROOM",
] as const;

export type FacilityUnitType = typeof FACILITY_UNIT_TYPES[number];

export const FACILITY_TYPE_LABELS: Record<FacilityUnitType, string> = {
  CHAIN: "Chuỗi bệnh viện/Tập đoàn",
  HOSPITAL: "Bệnh viện/Chi nhánh",
  DEPARTMENT: "Khoa",
  SPECIALTY: "Chuyên khoa",
  ROOM: "Phòng",
};
