import { IFieldConfig } from "../types/IFieldConfig";
import { buildDependencyGraph, topologicalSort } from "./RuleEngine";
import { extractConditionDependencies } from "./ConditionEvaluator";

export interface ICycleError {
  type: "dependency" | "self";
  fields: string[];
  message: string;
}

/**
 * Detects circular dependencies in field rules using Kahn's algorithm.
 * Operates on the dependency graph built from IFieldConfig.rules.
 */
export function detectDependencyCycles(
  fields: Record<string, IFieldConfig>
): ICycleError[] {
  const errors: ICycleError[] = [];
  const graph = buildDependencyGraph(fields);
  const { hasCycle, cycleFields } = topologicalSort(graph);

  if (hasCycle) {
    errors.push({
      type: "dependency",
      fields: cycleFields,
      message: `Circular dependency detected among fields: ${cycleFields.join(", ")}`,
    });
  }

  return errors;
}

/**
 * Detects self-dependencies (a field's rule references itself in a way that causes loops).
 */
export function detectSelfDependencies(
  fields: Record<string, IFieldConfig>
): ICycleError[] {
  const errors: ICycleError[] = [];

  for (const [fieldName, config] of Object.entries(fields)) {
    if (!config.rules) continue;
    for (const rule of config.rules) {
      // Check if the rule's condition references itself AND its effect targets itself
      const condDeps = extractConditionDependencies(rule.when);
      const selfInCondition = condDeps.includes(fieldName);

      if (selfInCondition && rule.then.fields?.[fieldName]) {
        errors.push({
          type: "self",
          fields: [fieldName],
          message: `Field "${fieldName}" has a rule that both depends on and modifies itself`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates the full dependency graph of field configs.
 * Logs warnings in development, returns errors for programmatic use.
 */
export function validateDependencyGraph(
  fields: Record<string, IFieldConfig>
): ICycleError[] {
  const errors: ICycleError[] = [];

  errors.push(...detectDependencyCycles(fields));
  errors.push(...detectSelfDependencies(fields));

  // Log warnings in development
  try {
    if (typeof globalThis !== "undefined" && (globalThis as Record<string, unknown>).__DEV__ !== false) {
      for (const error of errors) {
        console.warn(`[dynamic-forms] ${error.message}`);
      }
    }
  } catch {
    // Silently ignore
  }

  return errors;
}
