/** Generic dictionary type */
export type Dictionary<T> = Record<string, T>;

/** Entity data type */
export type IEntityData = Record<string, unknown>;

/** Sub-entity value type */
export type SubEntityType = string | number | boolean | Date | object | null | undefined;

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

export function isNull(value: unknown): value is null | undefined {
  return value == null;
}

export function isStringEmpty(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

export function deepCopy<T>(obj: T): T {
  return structuredClone(obj);
}

export function convertBooleanToYesOrNoText(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

/** Sort options alphabetically by label */
export function sortDropdownOptions(a: { label?: string }, b: { label?: string }): number {
  const aText = a.label ? a.label.toLowerCase() : "";
  const bText = b.label ? b.label.toLowerCase() : "";
  return aText < bText ? -1 : aText > bText ? 1 : 0;
}

/** Create an option from a value string (value and label are the same) */
export function createOption(value: string): { value: string; label: string } {
  return { value, label: value };
}
