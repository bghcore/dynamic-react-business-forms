import { IDropdownOption } from "./IDropdownOption";

/** Single value types for form fields */
export type SingleTypes = string | number | boolean | Date;

/**
 * Runtime business rule state for a single field.
 *
 * Contains the evaluated state of a field after all dependency rules have been processed.
 * This is the runtime representation consumed by form components to determine rendering
 * behavior (visibility, editability, validation, dropdown options, etc.).
 */
export interface IBusinessRule {
  /** UI component type to render (e.g., "Textbox", "Dropdown"). May be swapped by dependency rules. */
  component?: string;
  /** Whether the field is required for form submission. */
  required?: boolean;
  /** Whether the field is hidden (not rendered). Hidden fields skip validation. */
  hidden?: boolean;
  /** Whether the field is read-only (rendered but not editable). */
  readOnly?: boolean;
  /** Sync validation function names from the ValidationRegistry. */
  validations?: string[];
  /** Async validation function names from the async ValidationRegistry. */
  asyncValidations?: string[];
  /** Value function name from the ValueFunctionRegistry, executed on dependency trigger. */
  valueFunction?: string;
  /** Whether changing this field triggers a confirmation modal before save. */
  confirmInput?: boolean;
  /** Available options for dropdown-type fields. */
  dropdownOptions?: IDropdownOption[];
  /** Whether this field's value function only runs on create (not edit). */
  onlyOnCreate?: boolean;
  /** Static value to set on create when onlyOnCreate is true. */
  onlyOnCreateValue?: string | number | boolean | Date;
  /** Default value to set when the field value is null and the field is visible. */
  defaultValue?: SingleTypes;
  /** Fields that this field's value changes affect (forward dependencies). */
  dependentFields?: string[];
  /** Fields whose values affect this field (reverse dependencies). */
  dependsOnFields?: string[];
  /** Fields referenced in this field's order dependencies. */
  orderDependentFields?: string[];
  /** The root field that controls field ordering for this field's group. */
  pivotalRootField?: string;
  /** Fields that depend on this field for multi-field AND conditions. */
  comboDependentFields?: string[];
  /** Fields that this field's AND condition depends on. */
  comboDependsOnFields?: string[];
  /** Fields whose dropdown options are filtered by this field's value. */
  dependentDropdownFields?: string[];
  /** Fields that filter this field's dropdown options. */
  dependsOnDropdownFields?: string[];
  /** Computed value expression from field config. */
  computedValue?: string;
}
