import { Dictionary, IEntityData } from "../utils";
import { IBusinessRule } from "../types/IBusinessRule";
import { IBusinessRulesState } from "../types/IBusinessRulesState";
import { IConfigBusinessRules } from "../types/IConfigBusinessRules";
import { IFieldConfig } from "../types/IFieldConfig";

export interface IBusinessRulesProvider {
  businessRules: IBusinessRulesState;
  initBusinessRules: (
    configName: string,
    defaultValues: IEntityData,
    fieldConfigs: Dictionary<IFieldConfig>,
    areAllFieldsReadonly?: boolean,
    defaultFieldRules?: Dictionary<IBusinessRule>
  ) => IConfigBusinessRules;
  processBusinessRule: (
    entityData: IEntityData,
    configName: string,
    fieldName: string,
    previousValue: string,
    fieldConfigs: Dictionary<IFieldConfig>
  ) => void;
}

export const defaultBusinessRulesState: IBusinessRulesState = {
  configRules: {}
};
