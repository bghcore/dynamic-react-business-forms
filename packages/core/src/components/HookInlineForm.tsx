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
  /** Timeout in milliseconds for each save attempt. Defaults to 30000 (30 seconds). */
  saveTimeoutMs?: number;
  /** Maximum number of retry attempts on save failure. Defaults to 3. */
  maxSaveRetries?: number;
  /** Render custom expand/collapse button. If not provided, uses a simple <button>. */
  renderExpandButton?: (props: { isExpanded: boolean; onToggle: () => void }) => React.JSX.Element;
  /** Render custom filter/search input. If not provided and enableFilter is true, renders a simple <input>. */
  renderFilterInput?: (props: { onChange: (value: string) => void }) => React.JSX.Element;
  /** Render custom confirm dialog. Passed to HookConfirmInputsModal. */
  renderDialog?: (props: { isOpen: boolean; onSave: () => void; onCancel: () => void; children: React.ReactNode }) => React.JSX.Element;
  /** Form-level errors to display above the fields (e.g., server-side cross-field validation errors). */
  formErrors?: string[];
  /** Custom render function for field labels, passed through to HookFieldWrapper via HookInlineFormFields. */
  renderLabel?: (props: {
    id: string;
    labelId: string;
    label?: string;
    required?: boolean;
  }) => React.ReactNode;
  /** Custom render function for field error display, passed through to HookFieldWrapper via HookInlineFormFields. */
  renderError?: (props: {
    id: string;
    error?: import("react-hook-form").FieldError;
    errorCount?: number;
  }) => React.ReactNode;
  /** Custom render function for field status area, passed through to HookFieldWrapper via HookInlineFormFields. */
  renderStatus?: (props: {
    id: string;
    saving?: boolean;
    savePending?: boolean;
    errorCount?: number;
    isManualSave?: boolean;
  }) => React.ReactNode;
}

export const HookInlineForm: React.FC<IHookInlineFormProps> = (props: IHookInlineFormProps): React.JSX.Element => {
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
    currentUserId,
    onSaveError,
    saveTimeoutMs = 30000,
    maxSaveRetries = 3,
    renderExpandButton,
    renderFilterInput,
    renderDialog,
    formErrors,
    renderLabel,
    renderError,
    renderStatus,
  } = props;

  const saveData = props.saveData
    ? props.saveData
    : (): Promise<IEntityData> => {
        return Promise.resolve({} as IEntityData);
      };

  const { initBusinessRules, processBusinessRule, businessRules } = UseBusinessRulesContext();

  const saveTimeoutDelay = React.useRef<number | undefined>(undefined);
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const confirmInputModalProps = React.useRef<IConfirmInputModalProps | undefined>(undefined);
  const saveAbortControllerRef = React.useRef<AbortController | undefined>(undefined);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [expandEnabled, setExpandEnabled] = React.useState<boolean>();
  const [inputFieldsConfirmed, setInputFieldsConfirmed] = React.useState<boolean>(true);
  const [filterText, setFilterText] = React.useState<string>();
  const [statusMessage, setStatusMessage] = React.useState<string>("");

  const formMethods = useForm({
    mode: "onChange",
    defaultValues
  });

  const { reset, resetField, handleSubmit, trigger, setValue, getValues, setError, clearErrors, formState } = formMethods;

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
          currentUserId ?? "",
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

  /** Focus the first field that has a validation error */
  const focusFirstError = () => {
    const currentErrors = formStateRef.current.errors;
    const errorFieldNames = Object.keys(currentErrors);
    if (errorFieldNames.length > 0) {
      const firstErrorField = errorFieldNames[0];
      const element =
        document.getElementById(firstErrorField) ||
        document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
      if (element && typeof element.focus === "function") {
        element.focus();
      }
    }
  };

  const validateAndSave = () => {
    const { dirtyFields } = formStateRef.current;
    const businessRules = businessRulesRef.current;

    // Clear errors on hidden fields before validation so that fields
    // hidden by business rules do not block form submission.
    const configRules = businessRules.configRules[configName];
    if (configRules?.fieldRules) {
      Object.keys(configRules.fieldRules).forEach(fieldName => {
        if (configRules.fieldRules[fieldName]?.hidden) {
          clearErrors(fieldName);
        }
      });
    }

    setStatusMessage(HookInlineFormStrings.validating);
    trigger().then((valid: boolean) => {
      if (!valid) {
        setIsExpanded(true);
        setStatusMessage("");
        // Focus the first field with an error after validation failure
        requestAnimationFrame(() => {
          focusFirstError();
        });
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
          setStatusMessage("");
        } else if (dirtyFields && Object.keys(dirtyFields).length > 0) {
          setStatusMessage(HookInlineFormStrings.saving);
          handleSubmit(handleSave)();
          confirmInputModalProps.current = undefined;
        } else {
          setStatusMessage("");
        }
      }
    });
  };

  const handleSave = (data: IEntityData) => {
    // Abort any previous in-flight save request
    if (saveAbortControllerRef.current) {
      saveAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    saveAbortControllerRef.current = abortController;

    const dirtyFieldNames = Object.keys(formStateRef.current.dirtyFields);

    const saveWithTimeoutAndRetry = async (attempt: number): Promise<void> => {
      if (abortController.signal.aborted) return;

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(HookInlineFormStrings.saveTimeout)), saveTimeoutMs);
      });

      try {
        const updatedEntity = await Promise.race([
          saveData(data, dirtyFieldNames),
          timeoutPromise,
        ]);

        if (abortController.signal.aborted) return;

        setStatusMessage(HookInlineFormStrings.saved);
        if (!isCreate) {
          handleDirtyFields(updatedEntity, data);
        }
      } catch (error) {
        if (abortController.signal.aborted) return;

        if (attempt < maxSaveRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          if (abortController.signal.aborted) return;
          return saveWithTimeoutAndRetry(attempt + 1);
        }

        setStatusMessage(HookInlineFormStrings.saveFailed);
        dirtyFieldNames.forEach(field => {
          setError(field, { type: "custom", message: HookInlineFormStrings.saveError });
        });
        onSaveError?.(`${HookInlineFormStrings.saveError}${error ? `: ${error}` : ""}`);
      }
    };

    saveWithTimeoutAndRetry(0);
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
      {/* Visually-hidden ARIA live region for form status announcements */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        data-testid="form-status-live-region"
      >
        {statusMessage}
      </div>

      {enableFilter && (
        <div className="hook-inline-form-filter">
          {renderFilterInput ? (
            renderFilterInput({ onChange: onFilterChange })
          ) : (
            <input
              type="text"
              placeholder={HookInlineFormStrings.filterFields}
              aria-label={HookInlineFormStrings.filterFields}
              onChange={(e) => onFilterChange(e.target.value)}
              className="hook-inline-form-filter-input"
            />
          )}
        </div>
      )}
      {formErrors && formErrors.length > 0 && (
        <div className="hook-form-errors" role="alert" style={{
          color: "var(--hook-form-error-color, #d13438)",
          padding: "8px",
          marginBottom: "8px"
        }}>
          {formErrors.map((err, i) => (
            <div key={i} className="hook-form-error-item">{err}</div>
          ))}
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
          renderLabel={renderLabel}
          renderError={renderError}
          renderStatus={renderStatus}
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
