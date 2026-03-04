import { ICondition } from "./ICondition";

/**
 * Unified validation rule configuration.
 *
 * Handles sync, async, and cross-field validation through a single interface.
 * Validators are resolved by name from the unified ValidationRegistry.
 */
export interface IValidationRule {
  /** Validator name (resolved from the unified ValidationRegistry) */
  name: string;
  /** Parameters passed to the validator function */
  params?: Record<string, unknown>;
  /** Custom error message (overrides the validator's default) */
  message?: string;
  /** Whether this validator is async (returns a Promise) */
  async?: boolean;
  /** Debounce delay in ms for async validators */
  debounceMs?: number;
  /** Conditional validation: only run when this condition is met */
  when?: ICondition;
}
