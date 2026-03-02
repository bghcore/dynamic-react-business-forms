/** Generic dictionary type (replaces @cxpui/common Dictionary and lodash Dictionary) */
export type Dictionary<T> = Record<string, T>;

/** Entity data type (replaces @cxpui/common IEntityData) */
export type IEntityData = Record<string, unknown>;

/** Sub-entity value type (replaces @cxpui/common SubEntityType) */
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

export function getDropdownValue(option: { key: string | number; text: string } | undefined): string | undefined {
  if (!option) return undefined;
  return option.key != null ? String(option.key) : undefined;
}

export function setDropdownValue(value: string): { key: string | number; text: string } {
  return { key: value, text: value };
}

export function buildDropdownOption(text: string, key?: string): { key: string | number; text: string } {
  return { key: key ?? text, text };
}

export function convertBooleanToYesOrNoText(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

export function sortDropdownOptions(a: { text?: string }, b: { text?: string }): number {
  const aText = a.text ? a.text.toLowerCase() : "";
  const bText = b.text ? b.text.toLowerCase() : "";
  return aText < bText ? -1 : aText > bText ? 1 : 0;
}
