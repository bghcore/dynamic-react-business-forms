import { isNull } from "../utils";
import BusinessRulesActionType from "../types/IBusinessRuleAction";
import { ActionTypeKeys } from "../types/IBusinessRuleActionKeys";
import { IBusinessRulesState } from "../types/IBusinessRulesState";
import { defaultBusinessRulesState } from "../providers/IBusinessRulesProvider";

const businessRulesReducer = (state: IBusinessRulesState = defaultBusinessRulesState, action: BusinessRulesActionType): IBusinessRulesState => {
  switch (action.type) {
    case ActionTypeKeys.BUSINESSRULES_SET: {
      const configName = action.payload.configName!;
      return {
        configRules: {
          ...state.configRules,
          [configName]: { ...action.payload.configBusinessRules! }
        }
      };
    }
    case ActionTypeKeys.BUSINESSRULES_UPDATE: {
      const configName = action.payload.configName!;
      const existingConfig = state.configRules[configName];
      if (!existingConfig) return state;

      const updatedFieldRules = { ...existingConfig.fieldRules };
      Object.keys(action.payload.configBusinessRules!.fieldRules).forEach(fieldName => {
        updatedFieldRules[fieldName] = {
          ...updatedFieldRules[fieldName],
          ...action.payload.configBusinessRules!.fieldRules[fieldName]
        };
      });

      return {
        configRules: {
          ...state.configRules,
          [configName]: {
            fieldRules: updatedFieldRules,
            order: action.payload.configBusinessRules!.order
          }
        }
      };
    }
    case ActionTypeKeys.BUSINESSRULES_CLEAR: {
      if (action.payload.configName) {
        const { [action.payload.configName]: _, ...remaining } = state.configRules;
        return { configRules: remaining };
      }
      return defaultBusinessRulesState;
    }
    default:
      return state;
  }
};

export default businessRulesReducer;
