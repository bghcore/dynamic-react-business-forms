import { IDropdownOption } from "./IDropdownOption";

/** Single value types for form fields */
export type SingleTypes = string | number | boolean | Date;

export interface IBusinessRule {
  component?: string;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  validations?: string[];
  valueFunction?: string;
  confirmInput?: boolean;
  dropdownOptions?: IDropdownOption[];
  onlyOnCreate?: boolean;
  onlyOnCreateValue?: string | number | boolean | Date;
  defaultValue?: SingleTypes;
  dependentFields?: string[];
  dependsOnFields?: string[];
  orderDependentFields?: string[];
  pivotalRootField?: string;
  comboDependentFields?: string[];
  comboDependsOnFields?: string[];
  dependentDropdownFields?: string[];
  dependsOnDropdownFields?: string[];
}
