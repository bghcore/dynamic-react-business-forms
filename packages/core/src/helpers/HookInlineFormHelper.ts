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
import { getValidation } from "./ValidationRegistry";
import { executeValueFunction } from "./ValueFunctionRegistry";

export const GetChildEntity = (
  entityId?: string,
  entity?: IEntityData,
  entityPath?: string
): IEntityData | undefined => {
  if (!entity || !entityPath) return undefined;
  const childValues = (entity[entityPath] as IEntityData[])?.filter(child => child.EntityId === entityId);
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
  upn?: string
): SubEntityType => {
  return executeValueFunction(fieldName, valueFunctionName, fieldValue, parentEntity, upn);
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
  upn: string,
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
        upn
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

    const cxpDefault = fieldConfigSchema?.cxpDefault ? (fieldConfigSchema?.cxpDefault as string) : undefined;
    const defaultValue =
      cxpDefault && /^\{[\S\s]*}$/.test(cxpDefault)
        ? GetDefaultValue(cxpDefault.slice(1, -1), fieldConfigSchema.type)
        : cxpDefault;

    results[fieldName].defaultValue = defaultValue;

    results[fieldName].dropdownOptions = fieldConfigSchema?.values
      ? ProcessDropdownOptions(fieldConfigSchema.values as IDropdownOption[], fieldConfigs[fieldName])
      : [];

    fieldConfigSchema?.depdendencyRules?.forEach((dependencyRule: ISchemaDepRule) => {
      if (dependencyRule.cxpConditions?.length === 1) {
        const { cxpFieldName, cxpFieldValue } = dependencyRule.cxpConditions[0];
        const dropdownOptions = dependencyRule.cxpDependencyValues as string[];

        if (results[cxpFieldName]?.dropdownDependencies?.[cxpFieldValue]) {
          results[cxpFieldName].dropdownDependencies[cxpFieldValue][fieldName] = [...dropdownOptions];
        } else if (results[cxpFieldName]) {
          results[cxpFieldName].dropdownDependencies = results[cxpFieldName].dropdownDependencies || {};
          results[cxpFieldName].dropdownDependencies[cxpFieldValue] =
            results[cxpFieldName].dropdownDependencies[cxpFieldValue] || {};
          results[cxpFieldName].dropdownDependencies[cxpFieldValue][fieldName] = [...dropdownOptions];
        }
      }
    });

    results[fieldName].deprecatedDropdownOptions = fieldConfigSchema?.cxpDeprecatedEnum
      ? [...fieldConfigSchema?.cxpDeprecatedEnum]
      : [];
  });

  return results;
};

/** Schema types defined locally (were from ../../DataModelsSchema) */
export interface IPropertySchema {
  cxpDefault?: unknown;
  type?: string[];
  values?: unknown[];
  depdendencyRules?: ISchemaDepRule[];
  cxpDeprecatedEnum?: IDeprecatedOption[];
}

interface ISchemaDepRule {
  cxpConditions?: Array<{ cxpFieldName: string; cxpFieldValue: string }>;
  cxpDependencyValues?: string[];
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
