import { ICondition } from "./ICondition";
import { IFieldEffect } from "./IFieldEffect";

/**
 * A declarative rule that conditionally modifies field state.
 *
 * Rules replace the v1 dependencies, dependencyRules, dropdownDependencies,
 * and orderDependencies with a single unified system.
 */
export interface IRule {
  /** Optional rule identifier (for debugging/tracing) */
  id?: string;
  /** Condition that determines whether this rule fires */
  when: ICondition;
  /** Effects applied when the condition is true */
  then: IFieldEffect;
  /** Effects applied when the condition is false */
  else?: IFieldEffect;
  /** Priority for conflict resolution (higher = wins). Default: 0. */
  priority?: number;
}
