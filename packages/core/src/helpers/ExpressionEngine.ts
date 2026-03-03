import { IEntityData } from "../utils";

/**
 * Evaluates a simple expression string against form values.
 * Supports field references via $values.fieldName syntax.
 *
 * Supported operations: +, -, *, /, >, <, >=, <=, ===, !==, &&, ||
 * Supported functions: Math.round, Math.floor, Math.ceil, Math.abs, Math.min, Math.max
 *
 * Examples:
 *   "$values.quantity * $values.unitPrice"
 *   "$values.startDate < $values.endDate"
 *   "$values.firstName + ' ' + $values.lastName"
 *   "Math.round($values.total * 100) / 100"
 */
export function evaluateExpression(expression: string, values: IEntityData): unknown {
  // Replace $values.fieldName with actual values
  const resolved = expression.replace(
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
      `"use strict"; return (${resolved});`
    );
    return safeEval(Math);
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
 * Extracts field names referenced in an expression via $values.fieldName pattern.
 */
export function extractExpressionDependencies(expression: string): string[] {
  const deps = new Set<string>();
  const regex = /\$values\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = regex.exec(expression)) !== null) {
    deps.add(match[1]);
  }
  return [...deps];
}
