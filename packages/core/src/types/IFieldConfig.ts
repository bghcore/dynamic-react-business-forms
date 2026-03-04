import { IOption } from "./IOption";
import { IRule } from "./IRule";
import { IValidationRule } from "./IValidationRule";

/**
 * Static configuration for a single form field (v2 schema).
 *
 * This is the primary consumer-facing type used to define forms.
 * All dependency, validation, and state-management concerns use
 * the unified `rules` and `validate` arrays.
 */
export interface IFieldConfig {
  /** UI component type key (e.g., "Textbox", "Dropdown", "Toggle"). Must match a registered component. */
  type: string;
  /** Display label for the field (required in v2). */
  label: string;
  /** Whether the field is required for form submission. Can be overridden by rules. */
  required?: boolean;
  /** Whether the field is hidden by default. Can be toggled by rules. */
  hidden?: boolean;
  /** Whether the field is read-only (rendered but not editable). Can be toggled by rules. */
  readOnly?: boolean;
  /** Default value applied when the field is visible and its current value is null/undefined. */
  defaultValue?: unknown;
  /** Computed value expression. Uses $values.fieldName for references, $fn.name() for value functions. */
  computedValue?: string;
  /** If true, computedValue only runs during create (not edit). */
  computeOnCreateOnly?: boolean;
  /** Static dropdown/select options. */
  options?: IOption[];
  /** Validation rules (unified: sync, async, cross-field, conditional). */
  validate?: IValidationRule[];
  /** Business rules (unified: replaces dependencies, dependencyRules, dropdownDependencies, orderDependencies). */
  rules?: IRule[];
  /** Field array item configs (full IFieldConfig, not stripped). Keys are field names within an item. */
  items?: Record<string, IFieldConfig>;
  /** Minimum number of items in a field array. */
  minItems?: number;
  /** Maximum number of items in a field array. */
  maxItems?: number;
  /** Arbitrary metadata passed through to the field component (e.g., icons, sort settings). */
  config?: Record<string, unknown>;
  /** Short description shown as field tooltip or help text. */
  description?: string;
  /** Placeholder text for empty fields. */
  placeholder?: string;
  /** Extended help text (e.g., shown in a popover or below the field). */
  helpText?: string;
  /** Whether changing this field triggers a confirmation modal before save. */
  confirmInput?: boolean;
  /** If true, the field is not rendered when the form is in create mode. */
  hideOnCreate?: boolean;
  /** If true, the field ignores the layout-level disabled/readOnly override. */
  skipLayoutReadOnly?: boolean;
  /** Whether the field is disabled at the layout level. */
  disabled?: boolean;
}
