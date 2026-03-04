import { isEmpty, isNull } from "../utils";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ComponentTypes } from "../constants";
import { CheckFieldValidationRules, CheckAsyncFieldValidationRules, ShowField } from "../helpers/HookInlineFormHelper";
import { IOption } from "../types/IOption";
import { IValidationRule } from "../types/IValidationRule";
import { IRuntimeFieldState } from "../types/IRuntimeFieldState";
import { UseInjectedFieldContext } from "../providers/InjectedHookFieldProvider";
import { FormStrings } from "../strings";
import { FieldWrapper } from "./HookFieldWrapper";

interface IRenderFieldProps {
  fieldName: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  type: string;
  hidden?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  options?: IOption[];
  validate?: IValidationRule[];
  parentEntityId?: string;
  parentEntityType?: string;
  isManualSave?: boolean;
  setFieldValue: (fieldName: string, fieldValue: unknown, skipSave?: boolean) => void;
  isCreate?: boolean;
  filterText?: string;
  softHidden?: boolean;
  label?: string;
  skipLayoutReadOnly?: boolean;
  hideOnCreate?: boolean;
  config?: Record<string, unknown>;
  description?: string;
  placeholder?: string;
  helpText?: string;
  renderLabel?: (props: { id: string; labelId: string; label?: string; required?: boolean }) => React.ReactNode;
  renderError?: (props: { id: string; error?: import("react-hook-form").FieldError; errorCount?: number }) => React.ReactNode;
  renderStatus?: (props: { id: string; saving?: boolean; savePending?: boolean; errorCount?: number; isManualSave?: boolean }) => React.ReactNode;
}

const RenderField = (props: IRenderFieldProps) => {
  const {
    type, fieldName, entityId, entityType, programName,
    hidden, required, readOnly, disabled, options, validate,
    parentEntityId, parentEntityType, isManualSave,
    setFieldValue, isCreate, filterText, softHidden,
    label, skipLayoutReadOnly, hideOnCreate, config,
    description, placeholder, helpText,
    renderLabel, renderError, renderStatus,
  } = props;

  const { injectedFields } = UseInjectedFieldContext();
  const { control, getValues } = useFormContext();

  const isDisabled = disabled ?? false;
  const fieldNameConst = `${fieldName}` as const;

  const FieldComponent = React.useMemo(() => {
    const isReadOnly = readOnly || (isDisabled && (isNull(skipLayoutReadOnly) || (!isNull(skipLayoutReadOnly) && !skipLayoutReadOnly)));

    if ((isCreate && hideOnCreate) || hidden) return <></>;

    if (!isEmpty(injectedFields) && injectedFields[type]) {
      const Comp = injectedFields[type];
      return (
        <Controller
          name={fieldNameConst}
          control={control}
          rules={{
            required: required && type !== ComponentTypes.Toggle && !isReadOnly
              ? { value: true, message: FormStrings.required }
              : undefined,
            validate: async (value) => {
              if (!validate || validate.length === 0 || isReadOnly || !value) return undefined;
              // Build a mock runtime state for validation
              const fieldState: IRuntimeFieldState = { validate };
              const syncError = CheckFieldValidationRules(value, fieldName, getValues(), fieldState);
              if (syncError) return syncError;
              return CheckAsyncFieldValidationRules(value, fieldName, getValues(), fieldState);
            },
          }}
          render={({
            field: { value },
            fieldState: { error, isDirty },
            formState: { isSubmitting, isSubmitSuccessful, errors },
          }) => {
            const errorCount = errors ? Object.keys(errors).length : 0;
            const saving = isDirty && (isSubmitting || isSubmitSuccessful);
            const savePending = isDirty && errorCount > 0 && !isSubmitting && !isSubmitSuccessful;
            return type === "DynamicFragment" ? (
              <>{React.cloneElement(Comp, { value })}</>
            ) : ShowField(filterText, value, label) && !softHidden ? (
              <FieldWrapper
                id={fieldName}
                required={required}
                label={label}
                error={error}
                errorCount={errorCount}
                saving={saving}
                savePending={savePending}
                labelClassName="form-label"
                isManualSave={isManualSave}
                renderLabel={renderLabel}
                renderError={renderError}
                renderStatus={renderStatus}
              >
                {React.cloneElement(Comp, {
                  fieldName,
                  entityId,
                  entityType,
                  parentEntityId,
                  parentEntityType,
                  programName,
                  value,
                  readOnly: isReadOnly,
                  required,
                  error,
                  errorCount,
                  saving,
                  savePending,
                  config,
                  options,
                  label,
                  type,
                  description,
                  placeholder,
                  helpText,
                  setFieldValue,
                })}
              </FieldWrapper>
            ) : <></>;
          }}
        />
      );
    }

    const available = !isEmpty(injectedFields) ? Object.keys(injectedFields).join(", ") : "none";
    return (
      <div style={{ color: "red", fontSize: "0.85em", padding: "4px" }}>
        Missing component &quot;{type}&quot; for field &quot;{fieldName}&quot;. Available: [{available}]
      </div>
    );
  }, [type, hidden, required, readOnly, disabled, options, softHidden, renderLabel, renderError, renderStatus]);

  return FieldComponent;
};

export default React.memo(RenderField);
