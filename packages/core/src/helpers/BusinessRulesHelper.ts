import { Dictionary, IEntityData, isEmpty, isNull, setDropdownValue, sortDropdownOptions } from "../utils";
import { FIELD_PARENT_PREFIX, HookInlineFormConstants } from "../constants";
import { IBusinessRule } from "../types/IBusinessRule";
import { IConfigBusinessRules } from "../types/IConfigBusinessRules";
import { IFieldConfig } from "../types/IFieldConfig";
import { IDropdownOption } from "../types/IDropdownOption";
import { OrderDependencies, OrderDependencyMap } from "../types/IOrderDependencies";
import { CheckDeprecatedDropdownOptions } from "./HookInlineFormHelper";

/** Type alias for field dependencies (was IDynamicDependencies from DynamicLayout) */
type FieldDependencies = Dictionary<Dictionary<IFieldConfig>>;

export const ProcessAllBusinessRules = (
  entityData: IEntityData,
  fieldConfigs: Dictionary<IFieldConfig>,
  areAllFieldsReadonly?: boolean,
  defaultFieldRules?: Dictionary<IBusinessRule>
): IConfigBusinessRules => {
  const configBusinessRules = {
    fieldRules: defaultFieldRules ? defaultFieldRules : GetDefaultBusinessRules(fieldConfigs, areAllFieldsReadonly),
    order: Object.keys(fieldConfigs)
  };

  Object.keys(configBusinessRules.fieldRules).forEach(fieldName => {
    const fieldValue = GetFieldValue(entityData, fieldName);

    CombineBusinessRules(
      configBusinessRules,
      ProcessFieldBusinessRule(fieldName, fieldValue, configBusinessRules, fieldConfigs)
    );

    CombineBusinessRules(configBusinessRules, {
      fieldRules: ProcessComboFieldBusinessRule(
        fieldName,
        configBusinessRules.fieldRules[fieldName],
        fieldConfigs[fieldName],
        entityData
      ),
      order: configBusinessRules.order
    });

    CombineBusinessRules(
      configBusinessRules,
      ProcessFieldDropdownValues(
        fieldName,
        entityData,
        configBusinessRules,
        fieldConfigs,
        configBusinessRules.fieldRules
      )
    );

    if (configBusinessRules.fieldRules[fieldName]?.pivotalRootField) {
      CombineBusinessRules(
        configBusinessRules,
        ProcessFieldOrderDepencendies(
          configBusinessRules.fieldRules[fieldName]?.pivotalRootField,
          fieldConfigs,
          entityData
        ),
        true
      );
    }

    if (configBusinessRules.fieldRules[fieldName].dropdownOptions?.length > 0) {
      configBusinessRules.fieldRules[fieldName].dropdownOptions = [
        ...configBusinessRules.fieldRules[fieldName].dropdownOptions,
        ...CheckDeprecatedDropdownOptions(
          fieldConfigs[fieldName],
          configBusinessRules.fieldRules[fieldName].dropdownOptions,
          fieldValue
        )
      ];
    }
  });

  return configBusinessRules;
};

export const ProcessFieldBusinessRule = (
  fieldName: string,
  fieldValue: unknown,
  currentBusinessRules: IConfigBusinessRules,
  fieldConfigs: Dictionary<IFieldConfig>,
  pendingBusinessRules?: Dictionary<IBusinessRule>,
  targetField?: string
): IConfigBusinessRules => {
  let businessRulesChanged = false;
  const newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };

  if (fieldConfigs[fieldName]?.dependencies) {
    Object.keys(fieldConfigs[fieldName]?.dependencies).forEach(businessValue => {
      if (`${fieldValue}` === `${businessValue}` && !businessRulesChanged) {
        const dependentFields = fieldConfigs[fieldName].dependencies[businessValue];
        if (targetField && currentBusinessRules.fieldRules?.[targetField] && dependentFields[targetField]) {
          newConfigBusinessRules.fieldRules[targetField] = ApplyBusinessRule(
            currentBusinessRules.fieldRules[targetField],
            dependentFields[targetField],
            pendingBusinessRules?.[targetField]
          );
          businessRulesChanged = true;
        } else {
          Object.keys(dependentFields).forEach(dependentFieldName => {
            if (currentBusinessRules.fieldRules?.[dependentFieldName] && dependentFields[dependentFieldName]) {
              businessRulesChanged = true;
              newConfigBusinessRules.fieldRules[dependentFieldName] = ApplyBusinessRule(
                currentBusinessRules.fieldRules[dependentFieldName],
                dependentFields[dependentFieldName],
                pendingBusinessRules?.[dependentFieldName]
              );
            }
          });
        }
      }
    });
  }

  return newConfigBusinessRules;
};

export const ProcessFieldOrderDepencendies = (
  fieldName: string,
  fieldConfigs: Dictionary<IFieldConfig>,
  entityData: IEntityData
) => {
  const newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };

  if (fieldConfigs[fieldName]?.orderDependencies) {
    const order = GetFieldOrder(fieldConfigs[fieldName].orderDependencies, entityData, fieldName);
    if (order.length > 0) {
      newConfigBusinessRules.order = order;
    }
  }

  return newConfigBusinessRules;
};

export const GetFieldOrder = (
  orderDependencies: OrderDependencyMap,
  entityData: IEntityData,
  fieldName: string
): string[] => {
  const fieldValue = GetFieldValue(entityData, fieldName);
  let result: string[] = [];
  let orderRulesChecked = false;

  Object.keys(orderDependencies).forEach(businessValue => {
    if (fieldValue === `${businessValue}` && Array.isArray(orderDependencies[businessValue]) && !orderRulesChecked) {
      result = orderDependencies[businessValue] as string[];
      orderRulesChecked = true;
    } else if (fieldValue === `${businessValue}` && !orderRulesChecked) {
      const newFieldName = Object.keys(orderDependencies[businessValue])[0];
      result = GetFieldOrder(
        (orderDependencies[businessValue] as OrderDependencyMap)[newFieldName] as OrderDependencyMap,
        entityData,
        fieldName.includes(FIELD_PARENT_PREFIX) ? `${FIELD_PARENT_PREFIX}${newFieldName}` : newFieldName
      );
      orderRulesChecked = true;
    }
  });

  return result;
};

export const ProcessPreviousFieldBusinessRule = (
  fieldName: string,
  previousValue: string,
  currentBusinessRules: IConfigBusinessRules,
  fieldConfigs: Dictionary<IFieldConfig>,
  entityData: IEntityData,
  pendingBusinessRules: Dictionary<IBusinessRule>
): IConfigBusinessRules => {
  const newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };

  if (fieldConfigs[fieldName]?.dependencies?.[previousValue]) {
    const prevAffectedFields = Object.keys(fieldConfigs[fieldName].dependencies[previousValue]);
    prevAffectedFields.forEach(prevAffectedField => {
      if (currentBusinessRules.fieldRules && currentBusinessRules.fieldRules[prevAffectedField].dependsOnFields) {
        currentBusinessRules.fieldRules[prevAffectedField].dependsOnFields.forEach(dependOnField => {
          if (dependOnField !== fieldName) {
            CombineBusinessRules(
              newConfigBusinessRules,
              ProcessFieldBusinessRule(
                dependOnField,
                GetFieldValue(entityData, dependOnField),
                currentBusinessRules,
                fieldConfigs,
                pendingBusinessRules,
                prevAffectedField
              )
            );
          }
        });
      }
    });
  }

  return newConfigBusinessRules;
};

export const RevertFieldBusinessRule = (
  fieldName: string,
  previousValue: string,
  currentBusinessRules: IConfigBusinessRules,
  fieldConfigs: Dictionary<IFieldConfig>
): IConfigBusinessRules => {
  const newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };

  if (fieldConfigs[fieldName]?.dependencies?.[previousValue]) {
    const prevAffectedFields = Object.keys(fieldConfigs[fieldName].dependencies[previousValue]);
    prevAffectedFields.forEach(prevAffectedField => {
      if (
        currentBusinessRules.fieldRules &&
        currentBusinessRules.fieldRules[prevAffectedField] &&
        fieldConfigs[prevAffectedField]
      ) {
        newConfigBusinessRules.fieldRules[prevAffectedField] = {
          component: fieldConfigs[prevAffectedField].component,
          required: fieldConfigs[prevAffectedField].required ? fieldConfigs[prevAffectedField].required : false,
          hidden: fieldConfigs[prevAffectedField].hidden ? fieldConfigs[prevAffectedField].hidden : false,
          readOnly: fieldConfigs[prevAffectedField].isReadonly ? fieldConfigs[prevAffectedField].isReadonly : false,
          validations: fieldConfigs[prevAffectedField].validations ? fieldConfigs[prevAffectedField].validations : [],
          valueFunction: fieldConfigs[prevAffectedField].isValueFunction
            ? `${fieldConfigs[prevAffectedField].value}`
            : "",
          confirmInput: fieldConfigs[prevAffectedField].confirmInput
            ? fieldConfigs[prevAffectedField].confirmInput
            : false,
          dropdownOptions: currentBusinessRules.fieldRules[prevAffectedField].dropdownOptions
            ? [...currentBusinessRules.fieldRules[prevAffectedField].dropdownOptions]
            : []
        };
      }
    });
  }

  return newConfigBusinessRules;
};

const ApplyBusinessRule = (
  businessRule?: IBusinessRule,
  updatedBusinessRule?: IFieldConfig,
  inProgressBusinessRule?: IBusinessRule
): IBusinessRule => {
  return {
    ...businessRule,
    component: !isNull(updatedBusinessRule?.component)
      ? updatedBusinessRule.component
      : !isNull(inProgressBusinessRule?.component)
      ? inProgressBusinessRule.component
      : businessRule.component,
    required: !isNull(updatedBusinessRule?.required)
      ? updatedBusinessRule.required
      : !isNull(inProgressBusinessRule?.required)
      ? inProgressBusinessRule.required
      : businessRule.required,
    hidden: !isNull(updatedBusinessRule?.hidden)
      ? updatedBusinessRule.hidden
      : !isNull(inProgressBusinessRule?.hidden)
      ? inProgressBusinessRule.hidden
      : businessRule.hidden,
    readOnly: !isNull(updatedBusinessRule?.isReadonly)
      ? updatedBusinessRule.isReadonly
      : !isNull(inProgressBusinessRule?.readOnly)
      ? inProgressBusinessRule.readOnly
      : businessRule.readOnly,
    validations: !isNull(updatedBusinessRule?.validations)
      ? updatedBusinessRule.validations
      : !isNull(inProgressBusinessRule?.validations)
      ? inProgressBusinessRule.validations
      : businessRule.validations,
    valueFunction: !isNull(updatedBusinessRule?.isValueFunction)
      ? `${updatedBusinessRule.value}`
      : !isNull(inProgressBusinessRule?.valueFunction)
      ? inProgressBusinessRule.valueFunction
      : businessRule.valueFunction,
    confirmInput: !isNull(updatedBusinessRule?.confirmInput)
      ? updatedBusinessRule.confirmInput
      : !isNull(inProgressBusinessRule?.confirmInput)
      ? inProgressBusinessRule.confirmInput
      : businessRule.confirmInput,
    dropdownOptions: !isNull(updatedBusinessRule?.dropdownOptions)
      ? [...updatedBusinessRule.dropdownOptions]
      : !isNull(inProgressBusinessRule?.dropdownOptions)
      ? [...inProgressBusinessRule.dropdownOptions]
      : businessRule.dropdownOptions
  };
};

export const GetDefaultBusinessRules = (
  fieldConfigs: Dictionary<IFieldConfig>,
  areAllFieldsReadonly?: boolean
): Dictionary<IBusinessRule> => {
  const defaultBusinessRules: Dictionary<IBusinessRule> = {};
  Object.keys(fieldConfigs).map(fieldName => {
    const fieldConfig = fieldConfigs[fieldName];

    defaultBusinessRules[fieldName] = {
      component: fieldConfig.component,
      required: fieldConfig.required,
      hidden: fieldConfig.hidden || fieldConfig.component === HookInlineFormConstants.dynamicFragment,
      readOnly: areAllFieldsReadonly ? areAllFieldsReadonly : fieldConfig.isReadonly,
      onlyOnCreate: fieldConfig.onlyOnCreate,
      onlyOnCreateValue: fieldConfig.onlyOnCreate && !fieldConfig.isValueFunction ? fieldConfig.value : undefined,
      defaultValue: fieldConfig.defaultValue,
      valueFunction: fieldConfig.isValueFunction && fieldConfig.value ? `${fieldConfig.value}` : undefined,
      confirmInput: fieldConfig.confirmInput,
      validations: fieldConfig.validations,
      dependentFields: fieldConfig.dependencies ? GetDependentFields(fieldConfig.dependencies) : [],
      dependsOnFields: [],
      orderDependentFields: fieldConfig.orderDependencies ? GetOrderDependentFields(fieldConfig.orderDependencies) : [],
      pivotalRootField: fieldConfig.orderDependencies ? fieldName : undefined,
      comboDependentFields: [],
      comboDependsOnFields:
        fieldConfig.dependencyRules && fieldConfig.dependencyRules.rules
          ? Object.keys(fieldConfig.dependencyRules.rules)
          : [],
      dropdownOptions: fieldConfig.dropdownOptions,
      dependentDropdownFields: [],
      dependsOnDropdownFields: GetDependsOnDropDownFields(fieldConfig.dropdownDependencies)
    };
  });

  Object.keys(defaultBusinessRules).forEach(fieldName => {
    defaultBusinessRules[fieldName].dependentFields.forEach(dependentField => {
      if (defaultBusinessRules[dependentField]) {
        defaultBusinessRules[dependentField].dependsOnFields.push(fieldName);
      }
    });

    defaultBusinessRules[fieldName].orderDependentFields.forEach(orderDependentField => {
      if (defaultBusinessRules[orderDependentField]) {
        defaultBusinessRules[orderDependentField].pivotalRootField = fieldName;
      }
    });

    defaultBusinessRules[fieldName].comboDependsOnFields.forEach(dependsOnField => {
      if (defaultBusinessRules[dependsOnField]) {
        defaultBusinessRules[dependsOnField].comboDependentFields.push(fieldName);
      }
    });

    defaultBusinessRules[fieldName].dependsOnDropdownFields.forEach(dependsOnDropdownField => {
      if (
        defaultBusinessRules[dependsOnDropdownField] &&
        defaultBusinessRules[dependsOnDropdownField].dependentDropdownFields.indexOf(fieldName) === -1
      ) {
        defaultBusinessRules[dependsOnDropdownField].dependentDropdownFields.push(fieldName);
      }
    });
  });

  return defaultBusinessRules;
};

const GetDependentFields = (dependencies: FieldDependencies): string[] => {
  const dependentFields = new Set<string>();
  Object.keys(dependencies).forEach(value => {
    Object.keys(dependencies[value]).forEach(dependentField => {
      dependentFields.add(dependentField);
    });
  });

  return [...dependentFields];
};

const GetOrderDependentFields = (orderDependencies: OrderDependencyMap): string[] => {
  const orderDependentFields = new Set<string>();
  RecursiveGetOrderDependentFields(orderDependencies, orderDependentFields);
  return [...orderDependentFields];
};

const RecursiveGetOrderDependentFields = (
  orderDependencies: OrderDependencyMap,
  dependentFields: Set<string>,
  fieldName?: string
) => {
  Object.keys(orderDependencies).forEach(businessValue => {
    if (Array.isArray(orderDependencies[businessValue])) {
      fieldName && dependentFields.add(fieldName);
    } else {
      const newFieldName = Object.keys(orderDependencies[businessValue])[0];
      RecursiveGetOrderDependentFields(
        (orderDependencies[businessValue] as OrderDependencyMap)[newFieldName] as OrderDependencyMap,
        dependentFields,
        newFieldName
      );
    }
  });
};

export const ProcessComboFieldBusinessRule = (
  fieldName: string,
  currentBusinessRule: IBusinessRule,
  fieldConfig: IFieldConfig,
  entityData: IEntityData,
  pendingBusinessRule?: IBusinessRule
): Dictionary<IBusinessRule> => {
  const newBusinessRules: Dictionary<IBusinessRule> = {};

  if (fieldConfig && fieldConfig.dependencyRules && fieldConfig.dependencyRules.rules) {
    let rulesMet = true;
    Object.keys(fieldConfig.dependencyRules.rules).forEach(dependsOnFieldName => {
      const dependsOnFieldValue = GetFieldValue(entityData, dependsOnFieldName);
      if (rulesMet && fieldConfig.dependencyRules.rules[dependsOnFieldName].indexOf(`${dependsOnFieldValue}`) === -1) {
        rulesMet = false;
      }
    });

    if (rulesMet && fieldConfig.dependencyRules.updatedConfig) {
      newBusinessRules[fieldName] = ApplyBusinessRule(
        currentBusinessRule,
        fieldConfig.dependencyRules.updatedConfig,
        pendingBusinessRule
      );
    } else {
      newBusinessRules[fieldName] = {
        component: fieldConfig.component,
        required: fieldConfig.required,
        hidden: fieldConfig.hidden,
        readOnly: fieldConfig.isReadonly,
        validations: fieldConfig.validations,
        valueFunction: fieldConfig.isValueFunction ? `${fieldConfig.value}` : undefined,
        confirmInput: fieldConfig.confirmInput
      };
    }
  }

  return newBusinessRules;
};

export const ProcessDropdownOptions = (values: IDropdownOption[], fieldConfig: IFieldConfig): IDropdownOption[] => {
  let dropdownOptions: IDropdownOption[] = [...values];

  if (fieldConfig && fieldConfig.meta && fieldConfig.meta.data) {
    dropdownOptions = dropdownOptions.map((option, index) => {
      const iconConfig = (fieldConfig.meta.data as { icon: string; iconTitle: string }[])[index];
      return {
        ...option,
        data: iconConfig
          ? {
              iconName: iconConfig.icon,
              iconTitle: iconConfig.iconTitle
            }
          : undefined
      };
    });
  }

  if (fieldConfig && (!fieldConfig.meta || !fieldConfig.meta.disableAlphabeticSort)) {
    dropdownOptions = dropdownOptions.sort(sortDropdownOptions);
  }

  return dropdownOptions;
};

const GetDependsOnDropDownFields = (depdendencyRules?: Dictionary<Dictionary<string[]>>): string[] => {
  const result: string[] = [];

  if (depdendencyRules) {
    Object.keys(depdendencyRules).forEach(dependencyRule => {
      Object.keys(depdendencyRules[dependencyRule]).forEach(fieldName => {
        if (result.indexOf(fieldName) === -1) {
          result.push(fieldName);
        }
      });
    });
  }

  return result;
};

export const ProcessFieldDropdownValues = (
  fieldName: string,
  entityData: IEntityData,
  currentBusinessRules: IConfigBusinessRules,
  fieldConfigs: Dictionary<IFieldConfig>,
  pendingBusinessRules?: Dictionary<IBusinessRule>
): IConfigBusinessRules => {
  let businessRulesChanged = false;
  const newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };
  const fieldValue = GetFieldValue(entityData, fieldName);

  if (fieldConfigs[fieldName]?.dropdownDependencies) {
    Object.keys(fieldConfigs[fieldName].dropdownDependencies).forEach(businessValue => {
      if (`${fieldValue}` === `${businessValue}` && !businessRulesChanged) {
        const dependentFields = fieldConfigs[fieldName].dropdownDependencies[businessValue];

        Object.keys(dependentFields).forEach(dependentFieldName => {
          newConfigBusinessRules.fieldRules[dependentFieldName] = ApplyBusinessRule(
            currentBusinessRules.fieldRules[dependentFieldName],
            {
              dropdownOptions: ProcessDropdownOptions(
                [
                  ...fieldConfigs[fieldName].dropdownDependencies[businessValue][dependentFieldName].map(value =>
                    setDropdownValue(value)
                  )
                ],
                fieldConfigs[dependentFieldName]
              )
            },
            pendingBusinessRules?.[dependentFieldName]
          );

          if (newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions?.length > 0) {
            newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions = [
              ...newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions,
              ...CheckDeprecatedDropdownOptions(
                fieldConfigs[dependentFieldName],
                newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions,
                GetFieldValue(entityData, dependentFieldName)
              )
            ];
          }
        });
        businessRulesChanged = true;
      }
    });
  }

  return newConfigBusinessRules;
};

export const CombineBusinessRules = (
  existingConfigBusinessRules: IConfigBusinessRules,
  additionalConfigBusinessRules: IConfigBusinessRules,
  checkOrder?: boolean
) => {
  Object.keys(additionalConfigBusinessRules.fieldRules).forEach(fieldName => {
    if (isNull(existingConfigBusinessRules.fieldRules[fieldName])) {
      existingConfigBusinessRules.fieldRules[fieldName] = {};
    }
    const {
      component: newComponent,
      required: newRequired,
      hidden: newHidden,
      readOnly: newReadOnly,
      validations: newValidations,
      valueFunction: newValueFunction,
      confirmInput: newConfirmInput,
      dropdownOptions: newDropdownOptions
    } = additionalConfigBusinessRules.fieldRules[fieldName];
    const {
      component: oldComponent,
      required: oldRequired,
      hidden: oldHidden,
      readOnly: oldReadOnly,
      validations: oldValidations,
      valueFunction: oldValueFunction,
      confirmInput: oldConfirmInput,
      dropdownOptions: oldDropdownOptions
    } = existingConfigBusinessRules.fieldRules[fieldName];
    existingConfigBusinessRules.fieldRules[fieldName] = {
      ...existingConfigBusinessRules.fieldRules[fieldName],
      component: !isNull(newComponent) ? newComponent : oldComponent,
      required: !isNull(newRequired) ? newRequired : oldRequired,
      hidden: !isNull(newHidden) ? newHidden : oldHidden,
      readOnly: !isNull(newReadOnly) ? newReadOnly : oldReadOnly,
      validations: !isNull(newValidations) ? newValidations : oldValidations,
      valueFunction: !isNull(newValueFunction) ? newValueFunction : oldValueFunction,
      confirmInput: !isNull(newConfirmInput) ? newConfirmInput : oldConfirmInput,
      dropdownOptions: !isNull(newDropdownOptions) ? newDropdownOptions : oldDropdownOptions
    };
  });
  existingConfigBusinessRules.order =
    checkOrder && additionalConfigBusinessRules.order && additionalConfigBusinessRules.order.length > 0
      ? [...additionalConfigBusinessRules.order]
      : existingConfigBusinessRules.order;
};

export const GetFieldValue = (entityData: IEntityData, fieldName: string): string => {
  if (isEmpty(entityData)) {
    return "";
  } else {
    const splitFieldNames = fieldName.split(".");
    let fieldValue = "";
    if (splitFieldNames.length > 1) {
      let currentEntityData = entityData;
      splitFieldNames.forEach((splitFieldName, index) => {
        if (index === splitFieldNames.length - 1) {
          fieldValue = currentEntityData[splitFieldName] as string;
        } else if (currentEntityData[splitFieldName]) {
          currentEntityData = currentEntityData[splitFieldName] as IEntityData;
        }
      });
    } else {
      fieldValue = entityData[fieldName] as string;
    }

    return fieldValue;
  }
};

export const SameFieldOrder = (order: string[], previousOrder: string[]): boolean => {
  return (
    order.length === previousOrder.length &&
    previousOrder.every((fieldName, index) => {
      return fieldName === order[index];
    })
  );
};
