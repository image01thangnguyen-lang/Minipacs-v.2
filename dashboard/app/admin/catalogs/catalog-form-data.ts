export type CatalogFormValues = Record<string, unknown>;

/** Preserve native HTML form semantics expected by the existing Server Actions. */
export function buildCatalogFormData(values: CatalogFormValues, id?: string | null): FormData {
  const formData = new FormData();
  if (id) formData.append("id", id);

  for (const [key, value] of Object.entries(values)) {
    if (value === true) {
      formData.append(key, "on");
    } else if (value !== false && value != null) {
      formData.append(key, String(value));
    }
  }

  return formData;
}