import { Dictionary } from "../utils";
import { IDropdownOption } from "./IDropdownOption";
import { OrderDependencies, OrderDependencyMap } from "./IOrderDependencies";

export interface IFieldConfig {
  component?: string;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  /** @deprecated Use readOnly instead */
  isReadonly?: boolean;
  disabled?: boolean;
  label?: string;
  orderDependencies?: OrderDependencyMap;
  onlyOnCreate?: boolean;
  onlyOnCreateValue?: string | number | boolean | Date;
  defaultValue?: string | number | boolean;
  confirmInput?: boolean;
  hideOnCreate?: boolean;
  skipLayoutReadOnly?: boolean;
  dependencies?: Dictionary<Dictionary<IFieldConfig>>;
  dependencyRules?: IDependencyAndRules;
  dropdownDependencies?: Dictionary<Dictionary<string[]>>;
  isValueFunction?: boolean;
  validations?: string[];
  value?: string | number | boolean | Date;
  meta?: Dictionary<string | boolean | number | string[] | object>;
  dropdownOptions?: IDropdownOption[];
  deprecatedDropdownOptions?: IDeprecatedOption[];
}

export interface IDependencyAndRules {
  updatedConfig: Dictionary<IFieldConfig>;
  rules: Dictionary<string[]>;
}

export interface IDeprecatedOption {
  oldVal: string;
  newVal?: string;
  isDeleted?: boolean;
}
