import { Dictionary } from "../utils";
import { IDropdownOption } from "./IDropdownOption";
import { IFieldArrayConfig } from "./IFieldArrayConfig";
import { OrderDependencies, OrderDependencyMap } from "./IOrderDependencies";

/**
 * Static configuration for a single form field.
 *
 * This is the primary consumer-facing type used to define forms as JSON configuration.
 * It controls the field's rendering, validation, dependencies, and business rule behavior.
 * At runtime, field configs are processed into IBusinessRule objects by the business rules engine.
 */
export interface IFieldConfig {
  /** UI component type key (e.g., "Textbox", "Dropdown", "Toggle"). Must match a registered component in InjectedHookFieldProvider. */
  component?: string;
  /** Whether the field is required for form submission. Can be overridden by dependency rules. */
  required?: boolean;
  /** Whether the field is hidden by default. Can be toggled by dependency rules. */
  hidden?: boolean;
  /** Whether the field is read-only (rendered but not editable). Preferred over isReadonly. */
  readOnly?: boolean;
  /** @deprecated Use readOnly instead. Maps to readOnly during normalization. */
  isReadonly?: boolean;
  /** Whether the field is disabled at the layout level (affects readOnly calculation). */
  disabled?: boolean;
  /** Display label for the field. Used in HookFieldWrapper and filter matching. */
  label?: string;
  /** Order dependency rules that dynamically reorder fields based on another field's value. */
  orderDependencies?: OrderDependencyMap;
  /** If true, the field's value function runs only during create (not edit). */
  onlyOnCreate?: boolean;
  /** Static value to set during create when onlyOnCreate is true and isValueFunction is false. */
  onlyOnCreateValue?: string | number | boolean | Date;
  /** Default value applied when the field is visible and its current value is null. */
  defaultValue?: string | number | boolean;
  /** Whether changing fields that depend on this one triggers a confirmation modal. */
  confirmInput?: boolean;
  /** If true, the field is not rendered when the form is in create mode. */
  hideOnCreate?: boolean;
  /** If true, the field ignores the layout-level disabled/readOnly override. */
  skipLayoutReadOnly?: boolean;
  /**
   * Declarative dependency rules keyed by trigger field value.
   * Each entry maps a value to a dictionary of dependent field names and their config overrides.
   * Example: `{ "Active": { "endDate": { hidden: true } } }` hides endDate when this field is "Active".
   */
  dependencies?: Dictionary<Dictionary<IFieldConfig>>;
  /** AND-condition dependency rules requiring multiple fields to match before applying config changes. */
  dependencyRules?: IDependencyAndRules;
  /**
   * Dropdown filtering dependencies keyed by trigger field value.
   * Each entry maps a value to a dictionary of dependent dropdown field names and their allowed option keys.
   */
  dropdownDependencies?: Dictionary<Dictionary<string[]>>;
  /** If true, the `value` property is treated as a value function name from the ValueFunctionRegistry. */
  isValueFunction?: boolean;
  /** Sync validation function names from the ValidationRegistry. */
  validations?: string[];
  /** Async validation function names from the async ValidationRegistry. */
  asyncValidations?: string[];
  /** Debounce delay in milliseconds for async validations. */
  asyncValidationDebounceMs?: number;
  /** Static value or value function name (when isValueFunction is true). */
  value?: string | number | boolean | Date;
  /** Arbitrary metadata passed through to the field component (e.g., icons, sort settings). */
  meta?: Dictionary<string | boolean | number | string[] | object>;
  /** Static dropdown options for Dropdown, StatusDropdown, and Multiselect components. */
  dropdownOptions?: IDropdownOption[];
  /** Deprecated dropdown option mappings for backward compatibility with old values. */
  deprecatedDropdownOptions?: IDeprecatedOption[];
  /** Configuration for repeating field array (sub-form) behavior. */
  fieldArray?: IFieldArrayConfig;
  /** Computed value expression. Uses $values.fieldName for references. Evaluated reactively on dependency changes. */
  computedValue?: string;
  /** Cross-field validation names. Validators receive all form values. */
  crossFieldValidations?: string[];
}

/**
 * Configuration for AND-condition (combo) dependency rules.
 *
 * The `rules` dictionary maps field names to arrays of acceptable values.
 * ALL rules must be satisfied (AND logic) for the `updatedConfig` to be applied.
 */
export interface IDependencyAndRules {
  /** Config overrides to apply when all rules are met. */
  updatedConfig: Dictionary<IFieldConfig>;
  /** Dictionary of field names to arrays of acceptable values (all must match). */
  rules: Dictionary<string[]>;
}

/**
 * Represents a deprecated dropdown option mapping.
 *
 * Used to handle backward compatibility when dropdown option values change.
 * If a field's current value matches `oldVal`, the deprecated option is shown
 * as disabled with an info indicator.
 */
export interface IDeprecatedOption {
  /** The old/deprecated option value. */
  oldVal: string;
  /** The new replacement option value, if applicable. */
  newVal?: string;
  /** Whether this option has been completely removed (vs. renamed). */
  isDeleted?: boolean;
}
