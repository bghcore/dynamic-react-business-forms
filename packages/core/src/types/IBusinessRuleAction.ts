import { ActionTypeKeys } from "./IBusinessRuleActionKeys";
import { IConfigBusinessRules } from "./IConfigBusinessRules";

export interface IAddBusinessRules {
  readonly type: ActionTypeKeys.BUSINESSRULES_SET;
  readonly payload: {
    readonly configName: string;
    readonly configBusinessRules: IConfigBusinessRules;
  };
}

export interface IUpdateBusinessRules {
  readonly type: ActionTypeKeys.BUSINESSRULES_UPDATE;
  readonly payload: {
    readonly configName: string;
    readonly configBusinessRules: IConfigBusinessRules;
  };
}

export interface IClearBusinessRules {
  readonly type: ActionTypeKeys.BUSINESSRULES_CLEAR;
  readonly payload: {
    /** If provided, only clear rules for this config. If undefined, clear all configs. */
    readonly configName?: string;
  };
}

type BusinessRulesActionType = IAddBusinessRules | IUpdateBusinessRules | IClearBusinessRules;
export default BusinessRulesActionType;
