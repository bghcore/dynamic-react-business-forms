import { IEntityData } from "../utils";
import { getValueFunction } from "./ValueFunctionRegistry";

/**
 * Evaluates an expression string against form values.
 *
 * Supports:
 * - $values.fieldName for field references (including nested paths)
 * - $fn.name() for value function calls
 * - $parent.fieldName for parent entity references
 * - $root.fieldName alias for $values.fieldName
 * - Math functions: Math.round, Math.floor, Math.ceil, Math.abs, Math.min, Math.max
 * - Arithmetic: +, -, *, /
 * - Comparison: >, <, >=, <=, ===, !==
 * - Logical: &&, ||
 * - String concatenation via +
 *
 * @example
 *   "$values.quantity * $values.unitPrice"
 *   "$fn.setDate()"
 *   "$parent.category"
 *   "Math.round($values.total * 100) / 100"
 */
export function evaluateExpression(
  expression: string,
  values: IEntityData,
  fieldName?: string,
  parentEntity?: IEntityData,
  currentUserId?: string
): unknown {
  // Replace $fn.name() calls with their results
  let resolved = expression.replace(
    /\$fn\.([a-zA-Z_][a-zA-Z0-9_]*)\(\)/g,
    (_, fnName) => {
      const fn = getValueFunction(fnName);
      if (fn) {
        const result = fn({
          fieldName: fieldName ?? "",
          fieldValue: fieldName ? values[fieldName] as string : undefined,
          values,
          parentEntity,
          currentUserId,
        });
        if (result === null || result === undefined) return "undefined";
        if (typeof result === "string") return JSON.stringify(result);
        if (result instanceof Date) return `new Date(${result.getTime()})`;
        return String(result);
      }
      return "undefined";
    }
  );

  // Replace $parent.fieldName with parent entity values
  resolved = resolved.replace(
    /\$parent\.([a-zA-Z_][a-zA-Z0-9_.]*)/g,
    (_, fieldPath) => {
      const value = getNestedValue(parentEntity ?? {}, fieldPath);
      if (value === null || value === undefined) return "undefined";
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }
  );

  // Replace $root.fieldName (alias for $values)
  resolved = resolved.replace(
    /\$root\.([a-zA-Z_][a-zA-Z0-9_.]*)/g,
    (_, fieldPath) => {
      const value = getNestedValue(values, fieldPath);
      if (value === null || value === undefined) return "undefined";
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }
  );

  // Replace $values.fieldName with actual values
  resolved = resolved.replace(
    /\$values\.([a-zA-Z_][a-zA-Z0-9_.]*)/g,
    (_, fieldPath) => {
      const value = getNestedValue(values, fieldPath);
      if (value === null || value === undefined) return "undefined";
      if (typeof value === "string") return JSON.stringify(value);
      return String(value);
    }
  );

  // Safe evaluation using Function constructor with restricted scope
  try {
    const safeEval = new Function(
      "Math",
      "Date",
      `"use strict"; return (${resolved});`
    );
    return safeEval(Math, Date);
  } catch {
    return undefined;
  }
}

function getNestedValue(obj: IEntityData, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Extracts field names referenced in an expression via $values.fieldName or $root.fieldName.
 */
export function extractExpressionDependencies(expression: string): string[] {
  const deps = new Set<string>();
  const valuesRegex = /\$(?:values|root)\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = valuesRegex.exec(expression)) !== null) {
    deps.add(match[1]);
  }
  return [...deps];
}

/**
 * Extracts value function names referenced via $fn.name() syntax.
 */
export function extractFunctionDependencies(expression: string): string[] {
  const fns = new Set<string>();
  const fnRegex = /\$fn\.([a-zA-Z_][a-zA-Z0-9_]*)\(\)/g;
  let match;
  while ((match = fnRegex.exec(expression)) !== null) {
    fns.add(match[1]);
  }
  return [...fns];
}
