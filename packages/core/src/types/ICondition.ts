/**
 * Condition types for the v2 rule engine.
 *
 * Conditions can be field-level comparisons or logical combinations (AND/OR/NOT).
 * Used in IRule.when, IValidationRule.when, and IWizardStepCondition.
 */

/** A condition that compares a single field's value */
export interface IFieldCondition {
  /** The field name to evaluate */
  field: string;
  /** Comparison operator */
  operator:
    | "equals"
    | "notEquals"
    | "greaterThan"
    | "lessThan"
    | "greaterThanOrEqual"
    | "lessThanOrEqual"
    | "contains"
    | "notContains"
    | "startsWith"
    | "endsWith"
    | "in"
    | "notIn"
    | "isEmpty"
    | "isNotEmpty"
    | "matches";
  /** The value to compare against. Not required for isEmpty/isNotEmpty. */
  value?: unknown;
}

/** A logical combination of conditions */
export interface ILogicalCondition {
  /** Logical operator to combine child conditions */
  operator: "and" | "or" | "not";
  /** Child conditions to combine */
  conditions: ICondition[];
}

/** Union type: either a field comparison or a logical combination */
export type ICondition = IFieldCondition | ILogicalCondition;

/** Type guard: checks if a condition is a logical condition (and/or/not) */
export function isLogicalCondition(condition: ICondition): condition is ILogicalCondition {
  const op = condition.operator;
  return op === "and" || op === "or" || op === "not";
}

/** Type guard: checks if a condition is a field condition */
export function isFieldCondition(condition: ICondition): condition is IFieldCondition {
  return "field" in condition;
}
