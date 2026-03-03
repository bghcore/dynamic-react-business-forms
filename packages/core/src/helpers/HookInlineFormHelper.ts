import { Dictionary, IEntityData, SubEntityType, isEmpty, isNull, isStringEmpty, deepCopy, setDropdownValue, sortDropdownOptions } from "../utils";
import { UseFormSetValue } from "react-hook-form";
import { HookInlineFormConstants } from "../constants";
import { IBusinessRule } from "../types/IBusinessRule";
import { IConfigBusinessRules } from "../types/IConfigBusinessRules";
import { IConfirmInputModalProps } from "../types/IConfirmInputModalProps";
import { IExecuteValueFunction } from "../types/IExecuteValueFunction";
import { IDeprecatedOption, IFieldConfig } from "../types/IFieldConfig";
import { IFieldToRender } from "../types/IFieldToRender";
import { IDropdownOption } from "../types/IDropdownOption";
import { GetDefaultBusinessRules, ProcessDropdownOptions } from "./BusinessRulesHelper";
import { getValidation, getAsyncValidation, getCrossFieldValidation } from "./ValidationRegistry";
import { executeValueFunction } from "./ValueFunctionRegistry";

export const GetChildEntity = (
  entityId?: string,
  entity?: IEntityData,
  entityPath?: string,
  idField: string = "id"
): IEntityData | undefined => {
  if (!entity || !entityPath) return undefined;
  const childValues = (entity[entityPath] as IEntityData[])?.filter(child => child[idField] === entityId);
  return childValues?.length === 1 ? { ...childValues[0], Parent: { ...entity } } : undefined;
};

export const IsExpandVisible = (businessRules: Dictionary<IBusinessRule>, expandCutoffCount?: number): boolean => {
  let count = 0;
  Object.keys(businessRules).forEach(field => {
    if (!businessRules[field].hidden) {
      count += 1;
    }
  });

  return expandCutoffCount ? count > expandCutoffCount : count > HookInlineFormConstants.defaultExpandCutoffCount;
};

export const GetConfirmInputModalProps = (
  dirtyFieldNames: string[],
  fieldRules: Dictionary<IBusinessRule>
): IConfirmInputModalProps => {
  const confirmInputModalProps: IConfirmInputModalProps = {};

  dirtyFieldNames?.forEach(fieldName => {
    fieldRules[fieldName]?.dependentFields?.forEach(dependentFieldName => {
      if (fieldRules[dependentFieldName].confirmInput) {
        if (confirmInputModalProps.confirmInputsTriggeredBy === undefined) {
          confirmInputModalProps.confirmInputsTriggeredBy = fieldName;
          confirmInputModalProps.dependentFieldNames = [dependentFieldName];
        } else {
          confirmInputModalProps.dependentFieldNames!.push(dependentFieldName);
        }
      }
    });
  });

  confirmInputModalProps.otherDirtyFields = dirtyFieldNames?.filter(
    fieldName =>
      !confirmInputModalProps.dependentFieldNames?.includes(fieldName) &&
      fieldName !== confirmInputModalProps.confirmInputsTriggeredBy
  );

  return confirmInputModalProps;
};

export const GetValueFunctionsOnDirtyFields = (
  dirtyFieldNames: string[],
  fieldRules: Dictionary<IBusinessRule>
): IExecuteValueFunction[] => {
  const valueFunctions: IExecuteValueFunction[] = [];

  dirtyFieldNames?.forEach(fieldName => {
    fieldRules[fieldName]?.dependentFields?.forEach(dependentFieldName => {
      if (
        fieldRules[dependentFieldName].valueFunction &&
        !isStringEmpty(fieldRules[dependentFieldName].valueFunction) &&
        !fieldRules[dependentFieldName].onlyOnCreate &&
        dirtyFieldNames.indexOf(dependentFieldName) === -1
      ) {
        valueFunctions.push({
          fieldName: dependentFieldName,
          valueFunction: fieldRules[dependentFieldName].valueFunction
        });
      }
    });
  });

  return valueFunctions;
};

export const GetValueFunctionsOnCreate = (fieldRules: Dictionary<IBusinessRule>): IExecuteValueFunction[] => {
  const valueFunctions: IExecuteValueFunction[] = [];

  Object.keys(fieldRules).forEach(fieldName => {
    if (
      fieldRules[fieldName].valueFunction &&
      !isStringEmpty(fieldRules[fieldName].valueFunction) &&
      fieldRules[fieldName].onlyOnCreate
    ) {
      valueFunctions.push({
        fieldName,
        valueFunction: fieldRules[fieldName].valueFunction
      });
    }
  });

  return valueFunctions;
};

export const ExecuteValueFunction = (
  fieldName: string,
  valueFunctionName: string,
  fieldValue?: SubEntityType,
  parentEntity?: IEntityData,
  userId?: string
): SubEntityType => {
  return executeValueFunction(fieldName, valueFunctionName, fieldValue, parentEntity, userId);
};

export const CheckFieldValidationRules = (
  value: unknown,
  entityData: IEntityData,
  validations: string[]
): string | undefined => {
  let errorMessage = "";

  validations.forEach(validation => {
    const validationFn = getValidation(validation);
    const validationResult = validationFn ? validationFn(value, entityData) : undefined;
    if (validationResult && !errorMessage) {
      errorMessage = `${validationResult}`;
    } else if (validationResult) {
      errorMessage += ` & ${validationResult}`;
    }
  });

  return errorMessage ? errorMessage : undefined;
};

export const CheckAsyncFieldValidationRules = async (
  value: unknown,
  entityData: IEntityData,
  asyncValidations: string[],
  signal?: AbortSignal
): Promise<string | undefined> => {
  for (const validationName of asyncValidations) {
    if (signal?.aborted) return undefined;
    const validationFn = getAsyncValidation(validationName);
    if (validationFn) {
      const result = await validationFn(value, entityData, signal);
      if (result) return result;
    }
  }
  return undefined;
};

export const CheckValidDropdownOptions = (
  fieldRules: Dictionary<IBusinessRule>,
  fieldConfigs: Dictionary<IFieldConfig>,
  formValues: IEntityData,
  setValue: UseFormSetValue<IEntityData>
) => {
  if (!isEmpty(fieldRules) && !isEmpty(formValues)) {
    Object.keys(fieldRules).forEach(fieldName => {
      const { component, dropdownOptions } = fieldRules[fieldName];
      if (
        (component === HookInlineFormConstants.dropdown || component === HookInlineFormConstants.statusDropdown) &&
        !isNull(formValues[fieldName]) &&
        dropdownOptions?.findIndex(option => option.key === formValues[fieldName]) === -1 &&
        !CheckIsDeprecated(formValues[fieldName] as string, fieldConfigs[fieldName])
      ) {
        setValue(`${fieldName}` as const, null, { shouldDirty: false });
      } else if (component === HookInlineFormConstants.multiselect && !isNull(formValues[fieldName])) {
        const filteredValues = (formValues[fieldName] as string[])?.filter(
          option =>
            dropdownOptions?.map(dropdownOption => dropdownOption.key).includes(option) &&
            !CheckIsDeprecated(option, fieldConfigs[fieldName])
        );
        if (filteredValues?.length !== (formValues[fieldName] as string[]).length) {
          setValue(`${fieldName}` as const, filteredValues, { shouldDirty: false });
        }
      }
    });
  }
};

export const CheckDeprecatedDropdownOptions = (
  fieldConfig: IFieldConfig,
  dropdownOptions: IDropdownOption[],
  fieldValue?: unknown
): IDropdownOption[] => {
  const deprecatedOptions: IDropdownOption[] = [];
  const { component } = fieldConfig;
  if (
    (component === HookInlineFormConstants.dropdown || component === HookInlineFormConstants.statusDropdown) &&
    dropdownOptions?.findIndex(option => option.key === (fieldValue as string)) === -1 &&
    CheckIsDeprecated(fieldValue as string, fieldConfig)
  ) {
    deprecatedOptions.push({
      ...setDropdownValue(fieldValue as string),
      disabled: true,
      data: {
        iconName: "Info",
        iconTitle: "This value has been Deprecated"
      }
    });
  } else if (component === HookInlineFormConstants.multiselect) {
    (fieldValue as string[])?.forEach(selectedOption => {
      if (CheckIsDeprecated(selectedOption, fieldConfig)) {
        deprecatedOptions.push({
          ...setDropdownValue(selectedOption),
          disabled: true,
          data: {
            iconName: "Info",
            iconTitle: "This value has been Deprecated"
          }
        });
      }
    });
  }
  return deprecatedOptions;
};

export const CheckDefaultValues = (
  fieldRules: Dictionary<IBusinessRule>,
  formValues: IEntityData,
  setValue: UseFormSetValue<IEntityData>
) => {
  if (isEmpty(fieldRules) || isEmpty(formValues)) {
    return;
  }
  Object.keys(fieldRules).forEach(fieldName => {
    const { defaultValue, hidden } = fieldRules[fieldName];
    if (!isNull(defaultValue) && isNull(formValues[fieldName]) && !hidden) {
      setValue(`${fieldName}` as const, defaultValue, { shouldDirty: true });
    }
  });
};

export const CheckIsDeprecated = (entityValue: string, fieldConfig: IFieldConfig) => {
  const items = fieldConfig?.deprecatedDropdownOptions?.map((item: IDeprecatedOption) => item.oldVal);
  return items?.includes(entityValue);
};

export const InitOnCreateBusinessRules = (
  configName: string,
  fieldConfigs: Dictionary<IFieldConfig>,
  defaultValues: IEntityData,
  parentEntity: IEntityData,
  userId: string,
  setValue: UseFormSetValue<IEntityData>,
  initBusinessRules: (
    configName: string,
    defaultValues: IEntityData,
    fieldConfigs: Dictionary<IFieldConfig>,
    areAllFieldsReadonly?: boolean,
    defaultFieldRules?: Dictionary<IBusinessRule>
  ) => IConfigBusinessRules
): { onLoadRules: IConfigBusinessRules; initEntityData: IEntityData } => {
  const defaultBusinessRules = GetDefaultBusinessRules(fieldConfigs);
  const initEntityData: IEntityData = { ...defaultValues, Parent: { ...parentEntity } };
  const executeValueFunctions = GetValueFunctionsOnCreate(defaultBusinessRules);

  executeValueFunctions?.forEach(evf => {
    if (evf.valueFunction) {
      const fieldValue = ExecuteValueFunction(
        evf.fieldName,
        evf.valueFunction,
        undefined,
        parentEntity,
        userId
      );
      setValue(`${evf.fieldName}` as const, fieldValue);
      initEntityData[evf.fieldName] = fieldValue;
    }
  });

  Object.keys(defaultBusinessRules).forEach(fieldName => {
    if (defaultBusinessRules[fieldName].onlyOnCreateValue) {
      setValue(`${fieldName}` as const, defaultBusinessRules[fieldName].onlyOnCreateValue);
      initEntityData[fieldName] = defaultBusinessRules[fieldName].onlyOnCreateValue;
    } else if (defaultBusinessRules[fieldName].defaultValue) {
      setValue(`${fieldName}` as const, defaultBusinessRules[fieldName].defaultValue);
      initEntityData[fieldName] = defaultBusinessRules[fieldName].defaultValue;
    }
  });

  return {
    onLoadRules: initBusinessRules(configName, initEntityData, fieldConfigs, false, defaultBusinessRules),
    initEntityData
  };
};

export const InitOnEditBusinessRules = (
  configName: string,
  fieldConfigs: Dictionary<IFieldConfig>,
  defaultValues: IEntityData,
  areAllFieldsReadonly: boolean,
  initBusinessRules: (
    configName: string,
    defaultValues: IEntityData,
    fieldConfigs: Dictionary<IFieldConfig>,
    areAllFieldsReadonly?: boolean,
    defaultFieldRules?: Dictionary<IBusinessRule>
  ) => IConfigBusinessRules
): { onLoadRules: IConfigBusinessRules; initEntityData: IEntityData } => {
  return {
    onLoadRules: initBusinessRules(configName, defaultValues, fieldConfigs, areAllFieldsReadonly),
    initEntityData: defaultValues
  };
};

export const ShowField = (filterText?: string, value?: SubEntityType, label?: string): boolean => {
  if (!filterText) return true;
  const valueStr = JSON.stringify(value)?.toLowerCase();
  const labelStr = label?.toLowerCase();
  return (valueStr?.includes(filterText.toLowerCase()) ?? false) ||
    (labelStr?.includes(filterText.toLowerCase()) ?? false);
};

export const CombineSchemaConfig = (
  fieldConfigs: Dictionary<IFieldConfig>,
  schemaConfigs: Dictionary<IPropertySchema>
): Dictionary<IFieldConfig> => {
  const results = deepCopy(fieldConfigs);

  Object.keys(fieldConfigs).map(fieldName => {
    const fieldConfigSchema = schemaConfigs[fieldName];

    const schemaDefault = fieldConfigSchema?.defaultValue ? (fieldConfigSchema?.defaultValue as string) : undefined;
    const defaultValue =
      schemaDefault && /^\{[\S\s]*}$/.test(schemaDefault)
        ? GetDefaultValue(schemaDefault.slice(1, -1), fieldConfigSchema.type)
        : schemaDefault;

    results[fieldName].defaultValue = defaultValue;

    results[fieldName].dropdownOptions = fieldConfigSchema?.values
      ? ProcessDropdownOptions(fieldConfigSchema.values as IDropdownOption[], fieldConfigs[fieldName])
      : [];

    fieldConfigSchema?.depdendencyRules?.forEach((dependencyRule: ISchemaDepRule) => {
      if (dependencyRule.conditions?.length === 1) {
        const { fieldName: condFieldName, fieldValue: condFieldValue } = dependencyRule.conditions[0];
        const dropdownOptions = dependencyRule.dependencyValues as string[];

        if (results[condFieldName]?.dropdownDependencies?.[condFieldValue]) {
          results[condFieldName].dropdownDependencies[condFieldValue][fieldName] = [...dropdownOptions];
        } else if (results[condFieldName]) {
          results[condFieldName].dropdownDependencies = results[condFieldName].dropdownDependencies || {};
          results[condFieldName].dropdownDependencies[condFieldValue] =
            results[condFieldName].dropdownDependencies[condFieldValue] || {};
          results[condFieldName].dropdownDependencies[condFieldValue][fieldName] = [...dropdownOptions];
        }
      }
    });

    results[fieldName].deprecatedDropdownOptions = fieldConfigSchema?.deprecatedOptions
      ? [...fieldConfigSchema?.deprecatedOptions]
      : [];
  });

  return results;
};

/** Schema types defined locally */
export interface IPropertySchema {
  defaultValue?: unknown;
  type?: string[];
  values?: unknown[];
  depdendencyRules?: ISchemaDepRule[];
  deprecatedOptions?: IDeprecatedOption[];
}

interface ISchemaDepRule {
  conditions?: Array<{ fieldName: string; fieldValue: string }>;
  dependencyValues?: string[];
}

const SchemaTypes = {
  boolean: "boolean",
  number: "number",
  integer: "integer",
  string: "string",
} as const;

const GetDefaultValue = (value: string, type?: string[]): string | number | boolean => {
  if (!type) return value;
  if (type.indexOf(SchemaTypes.boolean) > -1) {
    try {
      return JSON.parse(value.toLowerCase()) as boolean;
    } catch {
      return value;
    }
  } else if (type.indexOf(SchemaTypes.number) > -1 || type.indexOf(SchemaTypes.integer) > -1) {
    return +value;
  } else if (type.indexOf(SchemaTypes.string) > -1) {
    return value.replace(/'/g, "");
  } else {
    return value;
  }
};

export const GetFieldsToRender = (
  fieldRenderLimit: number,
  fieldOrder: string[],
  fieldRules?: Dictionary<IBusinessRule>
): IFieldToRender[] => {
  if (fieldRenderLimit) {
    const fieldsToRender: IFieldToRender[] = [];
    let count = 0;
    fieldOrder.forEach(fieldName => {
      if (fieldRules?.[fieldName]?.hidden) {
        return;
      } else if (count === fieldRenderLimit) {
        fieldsToRender.push({ fieldName, softHidden: true });
      } else {
        fieldsToRender.push({ fieldName, softHidden: false });
        count += 1;
      }
    });
    return fieldsToRender;
  } else {
    return fieldOrder?.map(fieldName => {
      return { fieldName, softHidden: false };
    });
  }
};

export const CheckCrossFieldValidationRules = (
  entityData: IEntityData,
  fieldName: string,
  crossFieldValidations: string[]
): string | undefined => {
  for (const validationName of crossFieldValidations) {
    const validationFn = getCrossFieldValidation(validationName);
    if (validationFn) {
      const result = validationFn(entityData, fieldName);
      if (result) return result;
    }
  }
  return undefined;
};
