import { deepCopy } from "../utils";
import BusinessRulesActionType from "../types/IBusinessRuleAction";
import { ActionTypeKeys } from "../types/IBusinessRuleActionKeys";
import { IBusinessRulesState } from "../types/IBusinessRulesState";
import { defaultBusinessRulesState } from "../providers/IBusinessRulesProvider";

const businessRulesReducer = (state: IBusinessRulesState = defaultBusinessRulesState, action: BusinessRulesActionType): IBusinessRulesState => {
  const configName = action.payload.configName;
  switch (action.type) {
    case ActionTypeKeys.BUSINESSRULES_SET: {
      const newAddState = deepCopy(state);
      newAddState.configRules[configName] = { ...action.payload.configBusinessRules };
      return newAddState;
    }
    case ActionTypeKeys.BUSINESSRULES_UPDATE: {
      const newUpdateState = deepCopy(state);
      Object.keys(action.payload.configBusinessRules.fieldRules).forEach(fieldName => {
        newUpdateState.configRules[configName].fieldRules[fieldName] = {
          ...newUpdateState.configRules[configName].fieldRules[fieldName],
          ...action.payload.configBusinessRules.fieldRules[fieldName]
        };
      });
      newUpdateState.configRules[configName].order = action.payload.configBusinessRules.order;
      return newUpdateState;
    }
    default:
      return state;
  }
};

export default businessRulesReducer;
