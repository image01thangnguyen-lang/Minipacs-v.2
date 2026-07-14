export const fmtName = (name?: string) => (name ? name.replace(/\^/g, " ") : "Unknown Patient");
export const fmtText = (value?: string) => value || "-";
export const fmtSex = (sex?: string) => (sex === "M" ? "Nam" : sex === "F" ? "Nữ" : sex || "?");
export const fmtAge = (age?: string | number | null) => {
  if (typeof age === "number") return Number.isFinite(age) ? String(Math.trunc(age)) : "?";
  return age ? age.replace(/\D/g, "") : "?";
};

export const fmtDateTime = (date?: string, time?: string) => {
  if (!date) return "-";
  const dateValue = date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1");
  const timeValue = time ? time.substring(0, 4).replace(/(\d{2})(\d{2})/, "$1:$2") : "";
  return timeValue ? `${dateValue} ${timeValue}` : dateValue;
};

export const fmtDateTimeIso = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const fmtDuration = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined) return "-";
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}p` : `${hours}h`;
};

export const hisStatusLabel = (status?: string | null) => {
  if (!status) return "-";
  if (status === "SYNCED" || status === "SENT") return "Da dong bo";
  if (status === "FAILED") return "Loi";
  if (status === "PENDING") return "Dang cho";
  if (status === "DISABLED") return "Tat HIS";
  if (status === "SKIPPED") return "Bo qua";
  return status;
};
