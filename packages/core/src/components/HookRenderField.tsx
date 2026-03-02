import { isEmpty, isNull } from "../utils";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ComponentTypes } from "../constants";
import { CheckFieldValidationRules, ShowField } from "../helpers/HookInlineFormHelper";
import { IDropdownOption } from "../types/IDropdownOption";
import { UseInjectedHookFieldContext } from "../providers/InjectedHookFieldProvider";
import { HookInlineFormStrings } from "../strings";
import { HookFieldWrapper } from "./HookFieldWrapper";

interface IRenderFieldProps {
  fieldName: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  component: string;
  hidden?: boolean;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  dropdownOptions?: IDropdownOption[];
  validations?: string[];
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
  meta?: object;
}

const HookRenderField = (props: IRenderFieldProps) => {
  const {
    component,
    fieldName,
    entityId,
    entityType,
    programName,
    hidden,
    required,
    readOnly,
    disabled,
    dropdownOptions,
    validations,
    parentEntityId,
    parentEntityType,
    isManualSave,
    setFieldValue,
    isCreate,
    filterText,
    softHidden,
    label,
    skipLayoutReadOnly,
    hideOnCreate,
    meta,
  } = props;

  const { injectedFields } = UseInjectedHookFieldContext();
  const { control, getValues } = useFormContext();
  const [FieldComponent, setFieldComponent] = React.useState<JSX.Element>(<></>);

  const isDisabled = disabled ?? false;

  const fieldNameConst = `${fieldName}` as const;

  React.useEffect(() => {
    const isReadOnly =
      readOnly || (isDisabled && (isNull(skipLayoutReadOnly) || (!isNull(skipLayoutReadOnly) && !skipLayoutReadOnly)));

    if ((isCreate && hideOnCreate) || hidden) {
      setFieldComponent(<></>);
    } else if (!isEmpty(injectedFields) && injectedFields[component]) {
      const Comp = injectedFields[component];
      setFieldComponent(
        <Controller
          name={fieldNameConst}
          control={control}
          rules={{
            required:
              required && component !== ComponentTypes.Toggle && !isReadOnly
                ? {
                    value: true,
                    message: HookInlineFormStrings.required
                  }
                : undefined,
            validate:
              !isEmpty(validations) && validations.length > 0 && !isReadOnly
                ? value => (value ? CheckFieldValidationRules(value, getValues(), validations) : undefined)
                : undefined
          }}
          render={({
            field: { value },
            fieldState: { error, isDirty },
            formState: { isSubmitting, isSubmitSuccessful, errors }
          }) => {
            const errorCount = errors ? Object.keys(errors).length : 0;
            const saving = isDirty && (isSubmitting || isSubmitSuccessful);
            const savePending = isDirty && errorCount > 0 && !isSubmitting && !isSubmitSuccessful;
            return component === "DynamicFragment" ? (
              <>
                {React.cloneElement(Comp, {
                  value
                })}
              </>
            ) : ShowField(filterText, value, label) && !softHidden ? (
              <HookFieldWrapper
                id={fieldName}
                required={required}
                label={label}
                error={error}
                errorCount={errorCount}
                saving={saving}
                savePending={savePending}
                labelClassName="form-label"
                isManualSave={isManualSave}
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
                  meta,
                  dropdownOptions,
                  validations,
                  label,
                  component,
                  setFieldValue
                })}
              </HookFieldWrapper>
            ) : (
              <></>
            );
          }}
        />
      );
    } else {
      setFieldComponent(<>Missing Component ({component})</>);
    }
  }, [component, hidden, required, disabled, dropdownOptions, filterText, readOnly, softHidden]);

  return FieldComponent;
};

export default HookRenderField;
