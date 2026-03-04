import { IOption } from "./IOption";
import { IValidationRule } from "./IValidationRule";

/**
 * Effects applied by a rule when its condition is met (or in the else branch).
 *
 * Any property set here overrides the field's base config.
 * The `fields` property can affect OTHER fields (cross-field effects).
 */
export interface IFieldEffect {
  /** Override required state */
  required?: boolean;
  /** Override hidden state */
  hidden?: boolean;
  /** Override readOnly state */
  readOnly?: boolean;
  /** Swap the component type */
  component?: string;
  /** Replace dropdown options */
  options?: IOption[];
  /** Replace validation rules */
  validate?: IValidationRule[];
  /** Override computed value expression */
  computedValue?: string;
  /** Override field ordering */
  fieldOrder?: string[];
  /** Apply effects to OTHER fields (keyed by field name) */
  fields?: Record<string, IFieldEffect>;
}
