import { IEntityData, SubEntityType, isEmpty, isNull, isStringEmpty } from "../utils";
import { UseFormSetValue } from "react-hook-form";
import { IFieldConfig } from "../types/IFieldConfig";
import { IConfirmInputModalProps } from "../types/IConfirmInputModalProps";
import { IFieldToRender } from "../types/IFieldToRender";
import { IRuntimeFieldState, IRuntimeFormState } from "../types/IRuntimeFieldState";
import { IOption } from "../types/IOption";
import { evaluateAllRules } from "./RuleEngine";
import { runSyncValidations, runValidations, IValidationContext } from "./ValidationRegistry";
import { executeValueFunction } from "./ValueFunctionRegistry";
import { evaluateExpression } from "./ExpressionEngine";

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

export const IsExpandVisible = (
  fieldStates: Record<string, IRuntimeFieldState>,
  expandCutoffCount: number = 12
): boolean => {
  let count = 0;
  Object.keys(fieldStates).forEach(field => {
    if (!fieldStates[field].hidden) count += 1;
  });
  return count > expandCutoffCount;
};

export const GetConfirmInputModalProps = (
  dirtyFieldNames: string[],
  fieldStates: Record<string, IRuntimeFieldState>
): IConfirmInputModalProps => {
  const confirmInputModalProps: IConfirmInputModalProps = {};

  dirtyFieldNames?.forEach(fieldName => {
    fieldStates[fieldName]?.dependentFields?.forEach(dependentFieldName => {
      if (fieldStates[dependentFieldName]?.confirmInput) {
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

interface IExecuteComputedValue {
  fieldName: string;
  expression: string;
}

export const GetComputedValuesOnDirtyFields = (
  dirtyFieldNames: string[],
  fieldStates: Record<string, IRuntimeFieldState>
): IExecuteComputedValue[] => {
  const computedValues: IExecuteComputedValue[] = [];

  dirtyFieldNames?.forEach(fieldName => {
    fieldStates[fieldName]?.dependentFields?.forEach(dependentFieldName => {
      const state = fieldStates[dependentFieldName];
      if (
        state?.computedValue &&
        !state.computeOnCreateOnly &&
        !dirtyFieldNames.includes(dependentFieldName)
      ) {
        computedValues.push({
          fieldName: dependentFieldName,
          expression: state.computedValue,
        });
      }
    });
  });

  return computedValues;
};

export const GetComputedValuesOnCreate = (
  fieldStates: Record<string, IRuntimeFieldState>
): IExecuteComputedValue[] => {
  const computedValues: IExecuteComputedValue[] = [];

  Object.keys(fieldStates).forEach(fieldName => {
    const state = fieldStates[fieldName];
    if (state.computedValue && state.computeOnCreateOnly) {
      computedValues.push({
        fieldName,
        expression: state.computedValue,
      });
    }
  });

  return computedValues;
};

export const ExecuteComputedValue = (
  expression: string,
  values: IEntityData,
  fieldName?: string,
  parentEntity?: IEntityData,
  currentUserId?: string
): SubEntityType => {
  return evaluateExpression(expression, values, fieldName, parentEntity, currentUserId) as SubEntityType;
};

export const CheckFieldValidationRules = (
  value: unknown,
  fieldName: string,
  entityData: IEntityData,
  state: IRuntimeFieldState
): string | undefined => {
  if (!state.validate || state.validate.length === 0) return undefined;
  const context: IValidationContext = { fieldName, values: entityData };
  return runSyncValidations(value, state.validate, context);
};

export const CheckAsyncFieldValidationRules = async (
  value: unknown,
  fieldName: string,
  entityData: IEntityData,
  state: IRuntimeFieldState,
  signal?: AbortSignal
): Promise<string | undefined> => {
  if (!state.validate || state.validate.length === 0) return undefined;
  const context: IValidationContext = { fieldName, values: entityData, signal };
  return runValidations(value, state.validate, context);
};

export const CheckValidDropdownOptions = (
  fieldStates: Record<string, IRuntimeFieldState>,
  formValues: IEntityData,
  setValue: UseFormSetValue<IEntityData>
) => {
  if (isEmpty(fieldStates) || isEmpty(formValues)) return;

  Object.keys(fieldStates).forEach(fieldName => {
    const { type, options } = fieldStates[fieldName];
    if (
      (type === "Dropdown" || type === "StatusDropdown") &&
      !isNull(formValues[fieldName]) &&
      options &&
      options.findIndex(o => String(o.value) === String(formValues[fieldName])) === -1
    ) {
      setValue(`${fieldName}` as const, null, { shouldDirty: false });
    } else if (type === "Multiselect" && !isNull(formValues[fieldName]) && options) {
      const filteredValues = (formValues[fieldName] as string[])?.filter(
        val => options.some(o => String(o.value) === val)
      );
      if (filteredValues?.length !== (formValues[fieldName] as string[])?.length) {
        setValue(`${fieldName}` as const, filteredValues, { shouldDirty: false });
      }
    }
  });
};

export const CheckDefaultValues = (
  fieldStates: Record<string, IRuntimeFieldState>,
  formValues: IEntityData,
  setValue: UseFormSetValue<IEntityData>
) => {
  if (isEmpty(fieldStates) || isEmpty(formValues)) return;

  Object.keys(fieldStates).forEach(fieldName => {
    const { defaultValue, hidden } = fieldStates[fieldName];
    if (!isNull(defaultValue) && isNull(formValues[fieldName]) && !hidden) {
      setValue(`${fieldName}` as const, defaultValue, { shouldDirty: true });
    }
  });
};

export const InitOnCreateFormState = (
  configName: string,
  fields: Record<string, IFieldConfig>,
  defaultValues: IEntityData,
  parentEntity: IEntityData,
  userId: string,
  setValue: UseFormSetValue<IEntityData>,
  initFormState: (
    configName: string,
    defaultValues: IEntityData,
    fields: Record<string, IFieldConfig>,
    areAllFieldsReadonly?: boolean
  ) => IRuntimeFormState
): { formState: IRuntimeFormState; initEntityData: IEntityData } => {
  const initEntityData: IEntityData = { ...defaultValues, Parent: { ...parentEntity } };

  // Execute computed values for create
  for (const [fieldName, config] of Object.entries(fields)) {
    if (config.computedValue && config.computeOnCreateOnly) {
      const result = ExecuteComputedValue(
        config.computedValue,
        initEntityData,
        fieldName,
        parentEntity,
        userId
      );
      if (result !== undefined) {
        setValue(`${fieldName}` as const, result);
        initEntityData[fieldName] = result;
      }
    }
    if (config.defaultValue !== undefined && isNull(initEntityData[fieldName])) {
      setValue(`${fieldName}` as const, config.defaultValue);
      initEntityData[fieldName] = config.defaultValue;
    }
  }

  return {
    formState: initFormState(configName, initEntityData, fields, false),
    initEntityData,
  };
};

export const InitOnEditFormState = (
  configName: string,
  fields: Record<string, IFieldConfig>,
  defaultValues: IEntityData,
  areAllFieldsReadonly: boolean,
  initFormState: (
    configName: string,
    defaultValues: IEntityData,
    fields: Record<string, IFieldConfig>,
    areAllFieldsReadonly?: boolean
  ) => IRuntimeFormState
): { formState: IRuntimeFormState; initEntityData: IEntityData } => {
  return {
    formState: initFormState(configName, defaultValues, fields, areAllFieldsReadonly),
    initEntityData: defaultValues,
  };
};

export const ShowField = (filterText?: string, value?: SubEntityType, label?: string): boolean => {
  if (!filterText) return true;
  const valueStr = JSON.stringify(value)?.toLowerCase();
  const labelStr = label?.toLowerCase();
  return (valueStr?.includes(filterText.toLowerCase()) ?? false) ||
    (labelStr?.includes(filterText.toLowerCase()) ?? false);
};

export const GetFieldsToRender = (
  fieldRenderLimit: number,
  fieldOrder: string[],
  fieldStates?: Record<string, IRuntimeFieldState>
): IFieldToRender[] => {
  if (fieldRenderLimit) {
    const fieldsToRender: IFieldToRender[] = [];
    let count = 0;
    fieldOrder.forEach(fieldName => {
      if (fieldStates?.[fieldName]?.hidden) return;
      if (count === fieldRenderLimit) {
        fieldsToRender.push({ fieldName, softHidden: true });
      } else {
        fieldsToRender.push({ fieldName, softHidden: false });
        count += 1;
      }
    });
    return fieldsToRender;
  }
  return fieldOrder?.map(fieldName => ({ fieldName, softHidden: false }));
};

/** Sort options alphabetically by label */
export const SortOptions = (options: IOption[]): IOption[] => {
  return [...options].sort((a, b) => {
    const aLabel = a.label?.toLowerCase() ?? "";
    const bLabel = b.label?.toLowerCase() ?? "";
    return aLabel < bLabel ? -1 : aLabel > bLabel ? 1 : 0;
  });
};
