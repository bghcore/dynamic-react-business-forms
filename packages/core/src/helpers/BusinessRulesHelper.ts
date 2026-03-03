import { Dictionary, IEntityData, isEmpty, isNull, setDropdownValue, sortDropdownOptions } from "../utils";
import { FIELD_PARENT_PREFIX, HookInlineFormConstants } from "../constants";
import { IBusinessRule } from "../types/IBusinessRule";
import { IConfigBusinessRules } from "../types/IConfigBusinessRules";
import { IFieldConfig } from "../types/IFieldConfig";
import { IDropdownOption } from "../types/IDropdownOption";
import { OrderDependencies, OrderDependencyMap } from "../types/IOrderDependencies";
import { CheckDeprecatedDropdownOptions } from "./HookInlineFormHelper";
import { validateDependencyGraph } from "./DependencyGraphValidator";

/** Type alias for field dependencies (was IDynamicDependencies from DynamicLayout) */
type FieldDependencies = Dictionary<Dictionary<IFieldConfig>>;

/**
 * Compares a field value against a dependency rule key.
 * Uses string comparison but explicitly handles null/undefined/boolean
 * to prevent phantom matches.
 */
function dependencyValueMatches(fieldValue: unknown, ruleKey: string): boolean {
  if (fieldValue === null || fieldValue === undefined) {
    return ruleKey === "";
  }
  return String(fieldValue) === ruleKey;
}

/**
 * Normalizes a field config by mapping the deprecated `isReadonly` property to `readOnly`.
 *
 * If the config uses `isReadonly` but not `readOnly`, returns a new config object with
 * `readOnly` set to the `isReadonly` value. Emits a console warning in dev mode to
 * encourage migration to the `readOnly` property.
 *
 * @param fieldName - The field name, used for the deprecation warning message.
 * @param config - The field config to normalize.
 * @returns The original config if no normalization is needed, or a new config with `readOnly` set.
 */
export const normalizeFieldConfig = (fieldName: string, config: IFieldConfig): IFieldConfig => {
  if (config.isReadonly !== undefined && config.readOnly === undefined) {
    try {
      if (typeof globalThis !== "undefined" && (globalThis as Record<string, unknown>).__DEV__ !== false) {
        console.warn(
          `[dynamic-forms] Field "${fieldName}": "isReadonly" is deprecated. Use "readOnly" instead.`
        );
      }
    } catch { /* ignore */ }
    return { ...config, readOnly: config.isReadonly };
  }
  return config;
};

/**
 * Evaluates all business rules for every field in a form configuration.
 *
 * This is the full initialization lifecycle:
 * 1. Builds (or accepts pre-built) default business rules from field configs.
 * 2. Iterates every field and applies dependency rules based on current entity data.
 * 3. Evaluates combo (AND) rules, dropdown dependency filters, and order dependencies.
 * 4. Appends any deprecated dropdown options that match current field values.
 *
 * @param entityData - Current entity data (form values) used to evaluate dependency conditions.
 * @param fieldConfigs - Static field configuration dictionary defining all fields and their rules.
 * @param areAllFieldsReadonly - If true, forces all fields to read-only regardless of individual config.
 * @param defaultFieldRules - Optional pre-built default rules; if omitted, built from fieldConfigs.
 * @returns The fully evaluated config business rules containing field rules and field order.
 */
export const ProcessAllBusinessRules = (
  entityData: IEntityData,
  fieldConfigs: Dictionary<IFieldConfig>,
  areAllFieldsReadonly?: boolean,
  defaultFieldRules?: Dictionary<IBusinessRule>
): IConfigBusinessRules => {
  let configBusinessRules: IConfigBusinessRules = {
    fieldRules: defaultFieldRules ? defaultFieldRules : GetDefaultBusinessRules(fieldConfigs, areAllFieldsReadonly),
    order: Object.keys(fieldConfigs)
  };

  Object.keys(configBusinessRules.fieldRules).forEach(fieldName => {
    const fieldValue = GetFieldValue(entityData, fieldName);

    configBusinessRules = CombineBusinessRules(
      configBusinessRules,
      ProcessFieldBusinessRule(fieldName, fieldValue, configBusinessRules, fieldConfigs)
    );

    configBusinessRules = CombineBusinessRules(configBusinessRules, {
      fieldRules: ProcessComboFieldBusinessRule(
        fieldName,
        configBusinessRules.fieldRules[fieldName],
        fieldConfigs[fieldName],
        entityData
      ),
      order: configBusinessRules.order
    });

    configBusinessRules = CombineBusinessRules(
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
      configBusinessRules = CombineBusinessRules(
        configBusinessRules,
        ProcessFieldOrderDepencendies(
          configBusinessRules.fieldRules[fieldName]?.pivotalRootField,
          fieldConfigs,
          entityData
        ),
        true
      );
    }

    if ((configBusinessRules.fieldRules[fieldName]?.dropdownOptions?.length ?? 0) > 0) {
      configBusinessRules.fieldRules[fieldName].dropdownOptions = [
        ...(configBusinessRules.fieldRules[fieldName].dropdownOptions ?? []),
        ...CheckDeprecatedDropdownOptions(
          fieldConfigs[fieldName],
          configBusinessRules.fieldRules[fieldName].dropdownOptions ?? [],
          fieldValue
        )
      ];
    }
  });

  return configBusinessRules;
};

/**
 * Evaluates dependency rules for a single field based on its current value.
 *
 * Looks up the field's `dependencies` config, finds the entry matching the current
 * field value, and applies the resulting rule overrides to each dependent field.
 * If `targetField` is provided, only that specific dependent field is evaluated
 * (used during re-application of other fields' rules after a revert).
 *
 * @param fieldName - The field whose value has changed (the trigger field).
 * @param fieldValue - The current value of the trigger field.
 * @param currentBusinessRules - The current state of all field rules for this config.
 * @param fieldConfigs - Static field configuration dictionary.
 * @param pendingBusinessRules - In-progress rule changes from earlier steps in the evaluation pipeline.
 * @param targetField - If set, only evaluate rules for this specific dependent field.
 * @returns A config business rules object containing only the changed field rules.
 */
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
    Object.keys(fieldConfigs[fieldName].dependencies!).forEach(businessValue => {
      if (dependencyValueMatches(fieldValue, businessValue) && !businessRulesChanged) {
        const dependentFields = fieldConfigs[fieldName].dependencies![businessValue];
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
    if (dependencyValueMatches(fieldValue, businessValue) && Array.isArray(orderDependencies[businessValue]) && !orderRulesChecked) {
      result = orderDependencies[businessValue] as string[];
      orderRulesChecked = true;
    } else if (dependencyValueMatches(fieldValue, businessValue) && !orderRulesChecked) {
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

/**
 * Re-applies rules from OTHER fields that also affect the same dependents as the changed field.
 *
 * When a field's value changes and its previous rules are reverted, dependent fields may lose
 * rule overrides that were set by other fields. This function finds all fields that previously
 * affected the same dependents and re-evaluates their current rules so the dependent fields
 * retain the correct state from all active rule sources.
 *
 * @param fieldName - The field whose value changed (used to exclude from re-evaluation).
 * @param previousValue - The field's value before the change, used to look up which dependents were affected.
 * @param currentBusinessRules - Current state of all field rules for this config.
 * @param fieldConfigs - Static field configuration dictionary.
 * @param entityData - Current entity data for evaluating other fields' dependency conditions.
 * @param pendingBusinessRules - In-progress rule changes from earlier evaluation steps.
 * @returns A config business rules object containing re-applied rules from other source fields.
 */
export const ProcessPreviousFieldBusinessRule = (
  fieldName: string,
  previousValue: string,
  currentBusinessRules: IConfigBusinessRules,
  fieldConfigs: Dictionary<IFieldConfig>,
  entityData: IEntityData,
  pendingBusinessRules: Dictionary<IBusinessRule>
): IConfigBusinessRules => {
  let newConfigBusinessRules: IConfigBusinessRules = {
    fieldRules: {},
    order: []
  };

  if (fieldConfigs[fieldName]?.dependencies?.[previousValue]) {
    const prevAffectedFields = Object.keys(fieldConfigs[fieldName].dependencies[previousValue]);
    prevAffectedFields.forEach(prevAffectedField => {
      if (currentBusinessRules.fieldRules && currentBusinessRules.fieldRules[prevAffectedField].dependsOnFields) {
        currentBusinessRules.fieldRules[prevAffectedField].dependsOnFields.forEach(dependOnField => {
          if (dependOnField !== fieldName) {
            newConfigBusinessRules = CombineBusinessRules(
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

/**
 * Resets dependent fields to their default config state when a field's value changes.
 *
 * Before applying new dependency rules, the previous value's affected dependents must be
 * reverted to their baseline configuration (component, required, hidden, readOnly, etc.)
 * so that stale rule overrides do not persist. Dropdown options are preserved from the
 * current business rules since they may have been set by other dependency sources.
 *
 * @param fieldName - The field whose value changed.
 * @param previousValue - The field's value before the change, used to look up which dependents to revert.
 * @param currentBusinessRules - Current state of all field rules for this config.
 * @param fieldConfigs - Static field configuration dictionary (used as the source for default values).
 * @returns A config business rules object containing the reverted field rules.
 */
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

/**
 * Merges a dependency config (from IFieldConfig.dependencies) into an existing business rule.
 *
 * Uses a three-tier priority system for each property:
 * 1. The dependency override value (`updatedBusinessRule`) -- highest priority.
 * 2. Any in-progress rule from earlier evaluation steps (`inProgressBusinessRule`).
 * 3. The existing rule's current value (`businessRule`) -- lowest priority / fallback.
 *
 * Properties are only overwritten if the higher-priority source has a non-null value.
 *
 * @param businessRule - The current rule state for the field.
 * @param updatedBusinessRule - The dependency config to apply (from IFieldConfig).
 * @param inProgressBusinessRule - In-progress rule changes from earlier pipeline steps.
 * @returns A new IBusinessRule with merged values.
 */
const ApplyBusinessRule = (
  businessRule?: IBusinessRule,
  updatedBusinessRule?: IFieldConfig,
  inProgressBusinessRule?: IBusinessRule
): IBusinessRule => {
  if (!businessRule) return {} as IBusinessRule;
  return {
    ...businessRule,
    component: !isNull(updatedBusinessRule?.component)
      ? updatedBusinessRule!.component
      : !isNull(inProgressBusinessRule?.component)
      ? inProgressBusinessRule!.component
      : businessRule.component,
    required: !isNull(updatedBusinessRule?.required)
      ? updatedBusinessRule!.required
      : !isNull(inProgressBusinessRule?.required)
      ? inProgressBusinessRule!.required
      : businessRule.required,
    hidden: !isNull(updatedBusinessRule?.hidden)
      ? updatedBusinessRule!.hidden
      : !isNull(inProgressBusinessRule?.hidden)
      ? inProgressBusinessRule!.hidden
      : businessRule.hidden,
    readOnly: !isNull(updatedBusinessRule?.isReadonly)
      ? updatedBusinessRule!.isReadonly
      : !isNull(inProgressBusinessRule?.readOnly)
      ? inProgressBusinessRule!.readOnly
      : businessRule.readOnly,
    validations: !isNull(updatedBusinessRule?.validations)
      ? updatedBusinessRule!.validations
      : !isNull(inProgressBusinessRule?.validations)
      ? inProgressBusinessRule!.validations
      : businessRule.validations,
    valueFunction: !isNull(updatedBusinessRule?.isValueFunction)
      ? `${updatedBusinessRule!.value}`
      : !isNull(inProgressBusinessRule?.valueFunction)
      ? inProgressBusinessRule!.valueFunction
      : businessRule.valueFunction,
    confirmInput: !isNull(updatedBusinessRule?.confirmInput)
      ? updatedBusinessRule!.confirmInput
      : !isNull(inProgressBusinessRule?.confirmInput)
      ? inProgressBusinessRule!.confirmInput
      : businessRule.confirmInput,
    dropdownOptions: !isNull(updatedBusinessRule?.dropdownOptions)
      ? [...(updatedBusinessRule!.dropdownOptions ?? [])]
      : !isNull(inProgressBusinessRule?.dropdownOptions)
      ? [...(inProgressBusinessRule!.dropdownOptions ?? [])]
      : businessRule.dropdownOptions
  };
};

/**
 * Builds the initial (default) business rules state from static field configurations.
 *
 * For each field, creates an IBusinessRule with values derived from the field config
 * (component type, required, hidden, readOnly, validations, value functions, etc.).
 * Then wires up the bidirectional dependency graph: dependentFields <-> dependsOnFields,
 * order dependencies, combo dependencies, and dropdown dependencies.
 * Finally, validates the dependency graph for cycles in dev mode.
 *
 * @param fieldConfigs - Static field configuration dictionary.
 * @param areAllFieldsReadonly - If true, forces readOnly on all fields.
 * @returns A dictionary of default business rules keyed by field name.
 */
export const GetDefaultBusinessRules = (
  fieldConfigs: Dictionary<IFieldConfig>,
  areAllFieldsReadonly?: boolean
): Dictionary<IBusinessRule> => {
  const defaultBusinessRules: Dictionary<IBusinessRule> = {};
  Object.keys(fieldConfigs).map(fieldName => {
    const fieldConfig = normalizeFieldConfig(fieldName, fieldConfigs[fieldName]);

    defaultBusinessRules[fieldName] = {
      component: fieldConfig.component,
      required: fieldConfig.required,
      hidden: fieldConfig.hidden || fieldConfig.component === HookInlineFormConstants.dynamicFragment,
      readOnly: areAllFieldsReadonly ? areAllFieldsReadonly : (fieldConfig.readOnly ?? fieldConfig.isReadonly),
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
      dependsOnDropdownFields: GetDependsOnDropDownFields(fieldConfig.dropdownDependencies),
      computedValue: fieldConfig.computedValue,
    };
  });

  Object.keys(defaultBusinessRules).forEach(fieldName => {
    defaultBusinessRules[fieldName].dependentFields?.forEach(dependentField => {
      if (defaultBusinessRules[dependentField]) {
        defaultBusinessRules[dependentField].dependsOnFields!.push(fieldName);
      }
    });

    defaultBusinessRules[fieldName].orderDependentFields?.forEach(orderDependentField => {
      if (defaultBusinessRules[orderDependentField]) {
        defaultBusinessRules[orderDependentField].pivotalRootField = fieldName;
      }
    });

    defaultBusinessRules[fieldName].comboDependsOnFields?.forEach(dependsOnField => {
      if (defaultBusinessRules[dependsOnField]) {
        defaultBusinessRules[dependsOnField].comboDependentFields!.push(fieldName);
      }
    });

    defaultBusinessRules[fieldName].dependsOnDropdownFields?.forEach(dependsOnDropdownField => {
      if (
        defaultBusinessRules[dependsOnDropdownField] &&
        defaultBusinessRules[dependsOnDropdownField].dependentDropdownFields!.indexOf(fieldName) === -1
      ) {
        defaultBusinessRules[dependsOnDropdownField].dependentDropdownFields!.push(fieldName);
      }
    });
  });

  // Validate dependency graph for cycles (dev-mode only, logs warnings)
  validateDependencyGraph(defaultBusinessRules);

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

/**
 * Evaluates AND-condition (combo) rules for a single field.
 *
 * Combo rules require ALL referenced fields to have specific values before the rule
 * is applied. If all conditions are met, applies the `updatedConfig` from the
 * field's `dependencyRules`. If any condition fails, reverts the field to its
 * default config state (component, required, hidden, readOnly, validations, etc.).
 *
 * @param fieldName - The field being evaluated.
 * @param currentBusinessRule - The current rule state for this field.
 * @param fieldConfig - The static field config containing dependencyRules.
 * @param entityData - Current entity data for evaluating conditions.
 * @param pendingBusinessRule - In-progress rule changes from earlier evaluation steps.
 * @returns A dictionary containing the updated rule for this field (keyed by fieldName).
 */
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
      if (rulesMet && fieldConfig.dependencyRules!.rules[dependsOnFieldName].indexOf(`${dependsOnFieldValue}`) === -1) {
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

/**
 * Processes dropdown options by applying meta icon data and alphabetical sorting.
 *
 * If the field config has `meta.data`, each option is enriched with icon name and title
 * from the corresponding index in the meta array. Options are then sorted alphabetically
 * unless `meta.disableAlphabeticSort` is true.
 *
 * @param values - The raw dropdown option array to process.
 * @param fieldConfig - The field config containing optional meta and sort settings.
 * @returns A new array of processed dropdown options.
 */
export const ProcessDropdownOptions = (values: IDropdownOption[], fieldConfig: IFieldConfig): IDropdownOption[] => {
  let dropdownOptions: IDropdownOption[] = [...values];

  if (fieldConfig && fieldConfig.meta && fieldConfig.meta.data) {
    dropdownOptions = dropdownOptions.map((option, index) => {
      const iconConfig = (fieldConfig.meta!.data as { icon: string; iconTitle: string }[])[index];
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

/**
 * Filters dropdown options for dependent fields based on the trigger field's value.
 *
 * When a field has `dropdownDependencies` configured, this function finds the entry
 * matching the field's current value and updates each dependent field's dropdown options
 * to only include the values specified in the dependency rule. Also appends any deprecated
 * options that match the dependent field's current value.
 *
 * @param fieldName - The trigger field whose value determines which dropdown options to show.
 * @param entityData - Current entity data for reading field values.
 * @param currentBusinessRules - Current state of all field rules for this config.
 * @param fieldConfigs - Static field configuration dictionary.
 * @param pendingBusinessRules - In-progress rule changes from earlier evaluation steps.
 * @returns A config business rules object containing updated dropdown options for dependent fields.
 */
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
    Object.keys(fieldConfigs[fieldName].dropdownDependencies!).forEach(businessValue => {
      if (dependencyValueMatches(fieldValue, businessValue) && !businessRulesChanged) {
        const dependentFields = fieldConfigs[fieldName].dropdownDependencies![businessValue];

        Object.keys(dependentFields).forEach(dependentFieldName => {
          newConfigBusinessRules.fieldRules[dependentFieldName] = ApplyBusinessRule(
            currentBusinessRules.fieldRules[dependentFieldName],
            {
              dropdownOptions: ProcessDropdownOptions(
                [
                  ...fieldConfigs[fieldName].dropdownDependencies![businessValue][dependentFieldName].map(value =>
                    setDropdownValue(value)
                  )
                ],
                fieldConfigs[dependentFieldName]
              )
            },
            pendingBusinessRules?.[dependentFieldName]
          );

          if ((newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions?.length ?? 0) > 0) {
            newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions = [
              ...(newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions ?? []),
              ...CheckDeprecatedDropdownOptions(
                fieldConfigs[dependentFieldName],
                newConfigBusinessRules.fieldRules[dependentFieldName].dropdownOptions ?? [],
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

/**
 * Merges two config business rules objects into a new object (does not mutate inputs).
 *
 * For each field in the additional rules, merges its properties into the existing rules
 * using a "non-null wins" strategy: if a property in the additional rules is non-null,
 * it overwrites the existing value; otherwise the existing value is preserved.
 *
 * Field order is taken from the additional rules only when `checkOrder` is true and
 * the additional rules have a non-empty order array; otherwise the existing order is kept.
 *
 * @param existingConfigBusinessRules - The base config rules to merge into.
 * @param additionalConfigBusinessRules - The new rule changes to merge.
 * @param checkOrder - If true, use the additional rules' field order when available.
 * @returns A new IConfigBusinessRules object with merged field rules and order.
 */
export const CombineBusinessRules = (
  existingConfigBusinessRules: IConfigBusinessRules,
  additionalConfigBusinessRules: IConfigBusinessRules,
  checkOrder?: boolean
): IConfigBusinessRules => {
  const mergedFieldRules = { ...existingConfigBusinessRules.fieldRules };

  Object.keys(additionalConfigBusinessRules.fieldRules).forEach(fieldName => {
    const existing = mergedFieldRules[fieldName] ?? {};
    const additional = additionalConfigBusinessRules.fieldRules[fieldName];

    const {
      component: newComponent,
      required: newRequired,
      hidden: newHidden,
      readOnly: newReadOnly,
      validations: newValidations,
      valueFunction: newValueFunction,
      confirmInput: newConfirmInput,
      dropdownOptions: newDropdownOptions
    } = additional;
    const {
      component: oldComponent,
      required: oldRequired,
      hidden: oldHidden,
      readOnly: oldReadOnly,
      validations: oldValidations,
      valueFunction: oldValueFunction,
      confirmInput: oldConfirmInput,
      dropdownOptions: oldDropdownOptions
    } = existing;

    mergedFieldRules[fieldName] = {
      ...existing,
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

  return {
    fieldRules: mergedFieldRules,
    order: checkOrder && additionalConfigBusinessRules.order && additionalConfigBusinessRules.order.length > 0
      ? [...additionalConfigBusinessRules.order]
      : [...existingConfigBusinessRules.order]
  };
};

/**
 * Retrieves a field's value from entity data, supporting dotted path traversal.
 *
 * For simple field names (e.g., "status"), returns `entityData["status"]`.
 * For dotted paths (e.g., "Parent.category"), traverses nested objects.
 * Returns an empty string if the entity data is empty or the path is not found.
 *
 * @param entityData - The entity data object to read from.
 * @param fieldName - The field name, optionally using dot notation for nested paths.
 * @returns The field value as a string, or empty string if not found.
 */
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

/**
 * Compares two field order arrays for exact equality (same length, same elements in same positions).
 *
 * Used to determine whether a business rule evaluation produced a new field order that
 * requires dispatching an update to the reducer.
 *
 * @param order - The new field order array.
 * @param previousOrder - The previous field order array.
 * @returns True if both arrays have the same elements in the same order; false otherwise.
 */
export const SameFieldOrder = (order: string[], previousOrder: string[]): boolean => {
  return (
    order.length === previousOrder.length &&
    previousOrder.every((fieldName, index) => {
      return fieldName === order[index];
    })
  );
};
