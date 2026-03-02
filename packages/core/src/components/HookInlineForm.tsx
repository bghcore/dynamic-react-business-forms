import { Dictionary, IEntityData, SubEntityType, isEmpty } from "../utils";
import React from "react";
import { FormProvider, FormState, useForm } from "react-hook-form";
import { HookInlineFormConstants } from "../constants";
import {
  CheckDefaultValues,
  CheckValidDropdownOptions,
  ExecuteValueFunction,
  GetChildEntity,
  GetConfirmInputModalProps,
  GetValueFunctionsOnDirtyFields,
  InitOnCreateBusinessRules,
  InitOnEditBusinessRules,
  IsExpandVisible
} from "../helpers/HookInlineFormHelper";
import { IBusinessRulesState } from "../types/IBusinessRulesState";
import { IConfirmInputModalProps } from "../types/IConfirmInputModalProps";
import { IFieldConfig } from "../types/IFieldConfig";
import { IHookInlineFormSharedProps } from "../types/IHookInlineFormSharedProps";
import { UseBusinessRulesContext } from "../providers/BusinessRulesProvider";
import { HookInlineFormStrings } from "../strings";
import HookConfirmInputsModal from "./HookConfirmInputsModal";
import { HookInlineFormFields } from "./HookInlineFormFields";

interface IHookInlineFormProps extends IHookInlineFormSharedProps {
  fieldConfigs: Dictionary<IFieldConfig>;
  defaultValues: IEntityData;
  isChildEntity?: boolean;
  saveData?: (entityData: IEntityData, dirtyFieldNames?: string[]) => Promise<IEntityData>;
  /** Render custom expand/collapse button. If not provided, uses a simple <button>. */
  renderExpandButton?: (props: { isExpanded: boolean; onToggle: () => void }) => JSX.Element;
  /** Render custom filter/search input. If not provided and enableFilter is true, renders a simple <input>. */
  renderFilterInput?: (props: { onChange: (value: string) => void }) => JSX.Element;
  /** Render custom confirm dialog. Passed to HookConfirmInputsModal. */
  renderDialog?: (props: { isOpen: boolean; onSave: () => void; onCancel: () => void; children: React.ReactNode }) => JSX.Element;
}

export const HookInlineForm: React.FC<IHookInlineFormProps> = (props: IHookInlineFormProps): JSX.Element => {
  const {
    configName,
    entityId,
    entityType,
    programName,
    parentEntityId,
    parentEntityType,
    entityPath,
    expandCutoffCount,
    fieldConfigs,
    defaultValues,
    areAllFieldsReadonly,
    collapsedMaxHeight,
    isCreate,
    parentEntity,
    isChildEntity,
    enableFilter,
    currentUserUpn,
    onSaveError,
    renderExpandButton,
    renderFilterInput,
    renderDialog
  } = props;

  const saveData = props.saveData
    ? props.saveData
    : (): Promise<IEntityData> => {
        return Promise.resolve({} as IEntityData);
      };

  const { initBusinessRules, processBusinessRule, businessRules } = UseBusinessRulesContext();

  const saveTimeoutDelay = React.useRef<number>();
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>();
  const confirmInputModalProps = React.useRef<IConfirmInputModalProps>();
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [expandEnabled, setExpandEnabled] = React.useState<boolean>();
  const [inputFieldsConfirmed, setInputFieldsConfirmed] = React.useState<boolean>(true);
  const [filterText, setFilterText] = React.useState<string>();

  const formMethods = useForm({
    mode: "onChange",
    defaultValues
  });

  const { reset, resetField, handleSubmit, trigger, setValue, getValues, setError, formState } = formMethods;

  const businessRulesRef = React.useRef<IBusinessRulesState>(businessRules);
  const formStateRef = React.useRef<FormState<IEntityData>>({ ...formState });

  const { isDirty, isValid, dirtyFields, errors, isSubmitting, isSubmitSuccessful } = formState;

  React.useEffect(() => {
    businessRulesRef.current = businessRules;
  }, [businessRules]);

  React.useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  React.useEffect(() => {
    initForm(defaultValues);
  }, [areAllFieldsReadonly]);

  const initForm = (entityData: IEntityData) => {
    const { onLoadRules, initEntityData } = isCreate
      ? InitOnCreateBusinessRules(
          configName,
          fieldConfigs,
          entityData,
          parentEntity ?? {},
          currentUserUpn ?? "",
          setValue,
          initBusinessRules
        )
      : InitOnEditBusinessRules(configName, fieldConfigs, entityData, areAllFieldsReadonly ?? false, initBusinessRules);

    setExpandEnabled(IsExpandVisible(onLoadRules.fieldRules, expandCutoffCount));
    CheckValidDropdownOptions(onLoadRules.fieldRules, fieldConfigs, initEntityData, setValue);
  };

  React.useEffect(() => {
    if (businessRules.configRules[configName]) {
      CheckValidDropdownOptions(businessRules.configRules[configName].fieldRules, fieldConfigs, getValues(), setValue);
      CheckDefaultValues(businessRules.configRules[configName].fieldRules, getValues(), setValue);
      handleValueFunctions();
    }
  }, [businessRules]);

  const attemptSave = React.useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = undefined;
    }
    saveTimeout.current = setTimeout(() => {
      validateAndSave();
      clearTimeout(saveTimeout.current);
      saveTimeout.current = undefined;
    }, saveTimeoutDelay?.current || 100);
  }, [saveTimeout, inputFieldsConfirmed]);

  const setFieldValue = (fieldName: string, fieldValue: unknown, skipSave?: boolean, timeout?: number) => {
    saveTimeoutDelay.current = timeout;
    const previousValue = `${getValues(fieldName)}`;
    setValue(`${fieldName}` as const, fieldValue, { shouldDirty: !skipSave });
    trigger(fieldName);
    processBusinessRule(getValues(), configName, fieldName, previousValue, fieldConfigs);
    if (!skipSave) {
      attemptSave();
    }
  };

  const saveConfirmInputFields = () => {
    trigger().then((valid: boolean) => {
      if (valid) {
        setInputFieldsConfirmed(true);
        attemptSave();
      }
    });
  };

  const handleValueFunctions = () => {
    const { dirtyFields } = formStateRef.current;
    const businessRules = businessRulesRef.current;
    const executeValueFunctions = GetValueFunctionsOnDirtyFields(
      Object.keys(dirtyFields),
      businessRules.configRules[configName].fieldRules
    );
    if (executeValueFunctions.length > 0) {
      executeValueFunctions.forEach(evf => {
        if (evf.valueFunction) {
          const fieldValue = ExecuteValueFunction(
            evf.fieldName,
            evf.valueFunction,
            getValues(evf.fieldName) as SubEntityType
          );
          setValue(`${evf.fieldName}` as const, fieldValue as unknown, { shouldDirty: true });
        }
      });
    }
  };

  const validateAndSave = () => {
    const { dirtyFields } = formStateRef.current;
    const businessRules = businessRulesRef.current;

    trigger().then((valid: boolean) => {
      if (!valid) {
        setIsExpanded(true);
      } else {
        const newConfirmInputModalProps: IConfirmInputModalProps | undefined =
          confirmInputModalProps.current === undefined
            ? GetConfirmInputModalProps(Object.keys(dirtyFields), businessRules.configRules[configName].fieldRules)
            : undefined;

        if (
          newConfirmInputModalProps &&
          !isEmpty(newConfirmInputModalProps.confirmInputsTriggeredBy) &&
          (newConfirmInputModalProps.dependentFieldNames?.length ?? 0) > 0
        ) {
          confirmInputModalProps.current = newConfirmInputModalProps;
          setInputFieldsConfirmed(false);
        } else if (dirtyFields && Object.keys(dirtyFields).length > 0) {
          handleSubmit(handleSave)();
          confirmInputModalProps.current = undefined;
        }
      }
    });
  };

  const handleSave = (data: IEntityData) => {
    saveData(data, Object.keys(formStateRef.current.dirtyFields))
      .then(updatedEntity => {
        if (!isCreate) {
          handleDirtyFields(updatedEntity, data);
        }
      })
      .catch(error => {
        Object.keys(formStateRef.current.dirtyFields).forEach(field => {
          setError(field, { type: "custom", message: HookInlineFormStrings.saveError });
        });
        onSaveError?.(`${HookInlineFormStrings.saveError}${error ? `: ${error}` : ""}`);
      });
  };

  const handleDirtyFields = (entity: IEntityData, data: IEntityData) => {
    const { dirtyFields } = formStateRef.current;
    const stillDirtyFields: IEntityData = {};
    Object.keys(dirtyFields).forEach(field => {
      stillDirtyFields[field] = getValues(field);
    });
    const resetValue = isChildEntity ? (GetChildEntity(entityId, entity, entityPath) ?? entity) : entity;
    reset(resetValue);
    Object.keys(stillDirtyFields).forEach(field => {
      if (JSON.stringify(stillDirtyFields[field]) !== JSON.stringify(data[field])) {
        setFieldValue(field, stillDirtyFields[field], false, saveTimeoutDelay?.current);
      }
    });
  };

  const onFilterChange = (value: string) => {
    const timeOutId = setTimeout(() => {
      setFilterText(value);
    }, 500);
    return () => clearTimeout(timeOutId);
  };

  const cancelConfirmInputFields = () => {
    const current = confirmInputModalProps.current;
    if (current && current.otherDirtyFields && current.otherDirtyFields.length > 0) {
      if (current.confirmInputsTriggeredBy) {
        resetField(current.confirmInputsTriggeredBy);
      }
      if (current.dependentFieldNames) {
        current.dependentFieldNames.forEach(dependentFieldName => {
          resetField(dependentFieldName);
        });
      }
      saveData(getValues(), current.otherDirtyFields).then(updatedEntity => {
        initForm(updatedEntity);
      });
    } else {
      reset();
      initForm(getValues());
    }
    setInputFieldsConfirmed(true);
    confirmInputModalProps.current = undefined;
  };

  return (
    <FormProvider
      {...formMethods}
      formState={{
        ...formMethods.formState,
        isDirty,
        isValid,
        dirtyFields,
        errors,
        isSubmitting,
        isSubmitSuccessful
      }}
    >
      {enableFilter && (
        <div className="hook-inline-form-filter">
          {renderFilterInput ? (
            renderFilterInput({ onChange: onFilterChange })
          ) : (
            <input
              type="text"
              placeholder="Filter fields..."
              onChange={(e) => onFilterChange(e.target.value)}
              className="hook-inline-form-filter-input"
            />
          )}
        </div>
      )}
      <div className="hook-inline-form-wrapper">
        <HookInlineFormFields
          entityId={entityId}
          entityType={entityType}
          programName={programName}
          parentEntityId={parentEntityId}
          parentEntityType={parentEntityType}
          isExpanded={isExpanded}
          expandEnabled={expandEnabled}
          fieldOrder={businessRules?.configRules[configName]?.order}
          collapsedMaxHeight={collapsedMaxHeight}
          configRules={businessRules?.configRules[configName]}
          fieldConfigs={fieldConfigs}
          setFieldValue={setFieldValue}
          isManualSave={false}
          isCreate={isCreate}
          filterText={filterText}
          fieldRenderLimit={
            expandEnabled && !isExpanded
              ? expandCutoffCount
                ? expandCutoffCount
                : HookInlineFormConstants.defaultExpandCutoffCount
              : undefined
          }
        />

        {expandEnabled && (
          renderExpandButton ? (
            renderExpandButton({ isExpanded, onToggle: () => setIsExpanded(!isExpanded) })
          ) : (
            <button
              className="expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`${programName}-${entityType}-${entityId}-expand-form`}
            >
              {isExpanded ? HookInlineFormStrings.seeLess : HookInlineFormStrings.expand}
            </button>
          )
        )}
      </div>
      <HookConfirmInputsModal
        isOpen={confirmInputModalProps !== undefined && !inputFieldsConfirmed}
        configName={configName}
        entityId={entityId}
        entityType={entityType}
        programName={programName}
        fieldConfigs={fieldConfigs}
        confirmInputFields={confirmInputModalProps?.current?.dependentFieldNames ?? []}
        cancelConfirmInputFields={cancelConfirmInputFields}
        saveConfirmInputFields={saveConfirmInputFields}
        renderDialog={renderDialog}
      />
    </FormProvider>
  );
};
