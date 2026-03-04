import { FieldError } from "react-hook-form";
import { IOption } from "./IOption";

/**
 * Props passed to injected field components (v2 schema).
 *
 * This replaces the v1 IHookFieldSharedProps type.
 * The generic parameter T types the `config` metadata object.
 */
export interface IFieldProps<T = Record<string, unknown>> {
  /** Field name (unique identifier within the form) */
  fieldName?: string;
  /** Entity ID */
  entityId?: string;
  /** Entity type */
  entityType?: string;
  /** Program name */
  programName?: string;
  /** Parent entity ID */
  parentEntityId?: string;
  /** Parent entity type */
  parentEntityType?: string;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Current field error */
  error?: FieldError;
  /** Total error count across all fields */
  errorCount?: number;
  /** Whether the field is currently saving */
  saving?: boolean;
  /** Whether save is pending due to errors */
  savePending?: boolean;
  /** Current field value */
  value?: unknown;
  /** Field-specific config metadata (was `meta` in v1) */
  config?: T;
  /** Dropdown/select options (was `dropdownOptions` in v1) */
  options?: IOption[];
  /** Field label */
  label?: string;
  /** Component type string */
  type?: string;
  /** Description text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Callback to set a field's value */
  setFieldValue?: (fieldName: string, fieldValue: unknown, skipSave?: boolean, timeout?: number) => void;
}
