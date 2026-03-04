import { ICondition, IFieldCondition, ILogicalCondition, isLogicalCondition } from "../types/ICondition";
import { IEntityData } from "../utils";

/**
 * Evaluates a condition tree against the current form values.
 *
 * Supports all 15 field operators and AND/OR/NOT logical operators.
 */
export function evaluateCondition(condition: ICondition, values: IEntityData): boolean {
  if (isLogicalCondition(condition)) {
    return evaluateLogicalCondition(condition, values);
  }
  return evaluateFieldCondition(condition as IFieldCondition, values);
}

function evaluateLogicalCondition(condition: ILogicalCondition, values: IEntityData): boolean {
  switch (condition.operator) {
    case "and":
      return condition.conditions.every(c => evaluateCondition(c, values));
    case "or":
      return condition.conditions.some(c => evaluateCondition(c, values));
    case "not":
      // NOT applies to the first (and typically only) child condition
      return condition.conditions.length > 0
        ? !evaluateCondition(condition.conditions[0], values)
        : true;
    default:
      return false;
  }
}

function evaluateFieldCondition(condition: IFieldCondition, values: IEntityData): boolean {
  const fieldValue = getNestedValue(values, condition.field);

  switch (condition.operator) {
    case "equals":
      return looseEquals(fieldValue, condition.value);
    case "notEquals":
      return !looseEquals(fieldValue, condition.value);
    case "greaterThan":
      return toNumber(fieldValue) > toNumber(condition.value);
    case "lessThan":
      return toNumber(fieldValue) < toNumber(condition.value);
    case "greaterThanOrEqual":
      return toNumber(fieldValue) >= toNumber(condition.value);
    case "lessThanOrEqual":
      return toNumber(fieldValue) <= toNumber(condition.value);
    case "contains":
      return toString(fieldValue).includes(toString(condition.value));
    case "notContains":
      return !toString(fieldValue).includes(toString(condition.value));
    case "startsWith":
      return toString(fieldValue).startsWith(toString(condition.value));
    case "endsWith":
      return toString(fieldValue).endsWith(toString(condition.value));
    case "in":
      return Array.isArray(condition.value)
        ? condition.value.some(v => looseEquals(fieldValue, v))
        : false;
    case "notIn":
      return Array.isArray(condition.value)
        ? !condition.value.some(v => looseEquals(fieldValue, v))
        : true;
    case "isEmpty":
      return isValueEmpty(fieldValue);
    case "isNotEmpty":
      return !isValueEmpty(fieldValue);
    case "matches":
      try {
        return new RegExp(toString(condition.value)).test(toString(fieldValue));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Extracts all field names referenced in a condition tree.
 */
export function extractConditionDependencies(condition: ICondition): string[] {
  const deps = new Set<string>();
  collectDependencies(condition, deps);
  return [...deps];
}

function collectDependencies(condition: ICondition, deps: Set<string>): void {
  if (isLogicalCondition(condition)) {
    condition.conditions.forEach(c => collectDependencies(c, deps));
  } else {
    deps.add((condition as IFieldCondition).field);
  }
}

// --- Utility functions ---

function getNestedValue(obj: IEntityData, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }
  if (value instanceof Date) return value.getTime();
  return 0;
}

function toString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function isValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
