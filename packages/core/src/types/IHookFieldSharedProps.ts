import { FieldError } from "react-hook-form";
import { IDropdownOption } from "./IDropdownOption";

export interface IHookFieldSharedProps<T> {
  fieldName?: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  parentEntityId?: string;
  parentEntityType?: string;
  readOnly?: boolean;
  required?: boolean;
  error?: FieldError;
  errorCount?: number;
  saving?: boolean;
  savePending?: boolean;
  value?: unknown;
  meta?: T;
  dropdownOptions?: IDropdownOption[];
  validations?: string[];
  label?: string;
  component?: string;
  setFieldValue?: (fieldName: string, fieldValue: unknown, skipSave?: boolean, timeout?: number) => void;
}
