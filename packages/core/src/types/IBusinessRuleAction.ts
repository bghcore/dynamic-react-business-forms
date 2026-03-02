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

type BusinessRulesActionType = IAddBusinessRules | IUpdateBusinessRules;
export default BusinessRulesActionType;
