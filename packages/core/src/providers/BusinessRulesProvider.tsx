import { Dictionary, IEntityData } from "../utils";
import React from "react";
import {
  CombineBusinessRules,
  GetFieldValue,
  ProcessAllBusinessRules,
  ProcessComboFieldBusinessRule,
  ProcessFieldBusinessRule,
  ProcessFieldDropdownValues,
  ProcessFieldOrderDepencendies,
  ProcessPreviousFieldBusinessRule,
  RevertFieldBusinessRule,
  SameFieldOrder
} from "../helpers/BusinessRulesHelper";
import { IBusinessRule } from "../types/IBusinessRule";
import { ActionTypeKeys } from "../types/IBusinessRuleActionKeys";
import { IConfigBusinessRules } from "../types/IConfigBusinessRules";
import { IFieldConfig } from "../types/IFieldConfig";
import businessRulesReducer from "../reducers/BusinessRulesReducer";
import { IBusinessRulesProvider, defaultBusinessRulesState } from "./IBusinessRulesProvider";

const BusinessRulesContext: React.Context<IBusinessRulesProvider> = React.createContext(undefined as unknown as IBusinessRulesProvider);

export function UseBusinessRulesContext() {
  const context = React.useContext(BusinessRulesContext);
  if (context === undefined) {
    throw new Error(
      "UseBusinessRulesContext() was called outside of <BusinessRulesProvider>. " +
      "Required hierarchy: <BusinessRulesProvider> > <InjectedHookFieldProvider> > <HookInlineForm>"
    );
  }
  return context;
}

export const BusinessRulesProvider: React.FC<React.PropsWithChildren<{}>> = (
  props: React.PropsWithChildren<{}>
): React.JSX.Element => {
  const [businessRules, businessRulesDispatch] = React.useReducer(businessRulesReducer, defaultBusinessRulesState);

  const initBusinessRules = React.useCallback((
    configName: string,
    defaultValues: IEntityData,
    fieldConfigs: Dictionary<IFieldConfig>,
    areAllFieldsReadonly?: boolean,
    defaultFieldRules?: Dictionary<IBusinessRule>
  ): IConfigBusinessRules => {
    const configBusinessRules = ProcessAllBusinessRules(
      defaultValues,
      fieldConfigs,
      areAllFieldsReadonly,
      defaultFieldRules
    );

    businessRulesDispatch({
      type: ActionTypeKeys.BUSINESSRULES_SET,
      payload: { configName, configBusinessRules }
    });

    return configBusinessRules;
  }, []);

  const clearBusinessRules = React.useCallback((configName?: string) => {
    businessRulesDispatch({
      type: ActionTypeKeys.BUSINESSRULES_CLEAR,
      payload: { configName }
    });
  }, []);

  const processBusinessRule = React.useCallback((
    entityData: IEntityData,
    configName: string,
    fieldName: string,
    previousValue: string,
    fieldConfigs: Dictionary<IFieldConfig>
  ) => {
    if (
      (businessRules.configRules?.[configName]?.fieldRules[fieldName]?.dependentFields?.length ?? 0) > 0 ||
      (businessRules.configRules?.[configName]?.fieldRules[fieldName]?.dependsOnFields?.length ?? 0) > 0 ||
      businessRules.configRules?.[configName]?.fieldRules[fieldName]?.pivotalRootField ||
      (businessRules.configRules?.[configName]?.fieldRules[fieldName]?.comboDependentFields?.length ?? 0) > 0 ||
      (businessRules.configRules?.[configName]?.fieldRules[fieldName]?.dependentDropdownFields?.length ?? 0) > 0
    ) {
      let pendingBusinessRules: IConfigBusinessRules = {
        fieldRules: {},
        order: [...businessRules.configRules[configName].order]
      };

      pendingBusinessRules = CombineBusinessRules(
        pendingBusinessRules,
        RevertFieldBusinessRule(fieldName, previousValue, businessRules.configRules[configName], fieldConfigs)
      );

      pendingBusinessRules = CombineBusinessRules(
        pendingBusinessRules,
        ProcessPreviousFieldBusinessRule(
          fieldName,
          previousValue,
          businessRules.configRules[configName],
          fieldConfigs,
          entityData,
          pendingBusinessRules.fieldRules
        )
      );

      pendingBusinessRules = CombineBusinessRules(
        pendingBusinessRules,
        ProcessFieldBusinessRule(
          fieldName,
          GetFieldValue(entityData, fieldName),
          businessRules.configRules[configName],
          fieldConfigs,
          pendingBusinessRules.fieldRules
        )
      );

      businessRules.configRules[configName].fieldRules[fieldName].comboDependentFields?.forEach(dependentField => {
        pendingBusinessRules = CombineBusinessRules(pendingBusinessRules, {
          fieldRules: ProcessComboFieldBusinessRule(
            dependentField,
            businessRules.configRules[configName].fieldRules[dependentField],
            fieldConfigs[dependentField],
            entityData,
            pendingBusinessRules.fieldRules[dependentField]
          ),
          order: []
        });
      });

      pendingBusinessRules = CombineBusinessRules(
        pendingBusinessRules,
        ProcessFieldDropdownValues(
          fieldName,
          entityData,
          businessRules.configRules[configName],
          fieldConfigs,
          pendingBusinessRules.fieldRules
        )
      );

      if (businessRules.configRules?.[configName]?.fieldRules[fieldName]?.pivotalRootField) {
        pendingBusinessRules = CombineBusinessRules(
          pendingBusinessRules,
          ProcessFieldOrderDepencendies(
            businessRules.configRules?.[configName]?.fieldRules[fieldName]?.pivotalRootField,
            fieldConfigs,
            entityData
          ),
          true
        );
      }

      if (
        Object.keys(pendingBusinessRules.fieldRules).length > 0 ||
        !SameFieldOrder(pendingBusinessRules.order, businessRules.configRules[configName].order)
      ) {
        businessRulesDispatch({
          type: ActionTypeKeys.BUSINESSRULES_UPDATE,
          payload: { configName, configBusinessRules: pendingBusinessRules }
        });
      }
    }
  }, [businessRules]);

  const providerValue: IBusinessRulesProvider = React.useMemo(() => ({
    businessRules,
    initBusinessRules,
    processBusinessRule,
    clearBusinessRules
  }), [businessRules, initBusinessRules, processBusinessRule, clearBusinessRules]);

  return <BusinessRulesContext.Provider value={providerValue}>{props.children}</BusinessRulesContext.Provider>;
};
