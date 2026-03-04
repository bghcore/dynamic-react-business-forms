import React from "react";
import { GetFieldsToRender } from "../helpers/HookInlineFormHelper";
import { IRuntimeFormState } from "../types/IRuntimeFieldState";
import { IFieldConfig } from "../types/IFieldConfig";
import RenderField from "./HookRenderField";
import { FormErrorBoundary } from "./HookFormErrorBoundary";

interface IFormFieldsProps {
  entityId?: string;
  entityType?: string;
  programName?: string;
  parentEntityId?: string;
  parentEntityType?: string;
  isExpanded?: boolean;
  expandEnabled?: boolean;
  fieldOrder?: string[];
  inPanel?: boolean;
  collapsedMaxHeight?: number;
  formState?: IRuntimeFormState;
  fields?: Record<string, IFieldConfig>;
  setFieldValue: (fieldName: string, fieldValue: unknown, skipSave?: boolean) => void;
  isManualSave?: boolean;
  isCreate?: boolean;
  filterText?: string;
  fieldRenderLimit?: number;
  renderLabel?: (props: { id: string; labelId: string; label?: string; required?: boolean }) => React.ReactNode;
  renderError?: (props: { id: string; error?: import("react-hook-form").FieldError; errorCount?: number }) => React.ReactNode;
  renderStatus?: (props: { id: string; saving?: boolean; savePending?: boolean; errorCount?: number; isManualSave?: boolean }) => React.ReactNode;
}

export const FormFields = (props: IFormFieldsProps) => {
  const {
    entityId, entityType, programName, parentEntityId, parentEntityType,
    isExpanded, expandEnabled, fieldOrder, inPanel, collapsedMaxHeight,
    formState, fields, setFieldValue, isManualSave, isCreate, filterText,
    fieldRenderLimit, renderLabel, renderError, renderStatus,
  } = props;

  const collapsedClass = !isExpanded && (expandEnabled || expandEnabled === undefined) ? "collapsed" : "";
  const fieldsToRender = GetFieldsToRender(fieldRenderLimit ?? 0, fieldOrder ?? [], formState?.fieldStates);
  const loadingKey = `${programName}-${entityType}-${entityId}-form-loaded`;

  return (
    <div className={`dynamic-form-container ${collapsedClass}`}>
      <form
        className={`dynamic-form ${collapsedClass} ${inPanel ? "in-panel" : ""}`}
        style={collapsedClass && collapsedMaxHeight ? { maxHeight: `${collapsedMaxHeight}px` } : undefined}
        data-testid={`${programName}-${entityType}-${entityId}-form`}
      >
        <input type="hidden" id={loadingKey} name={loadingKey} data-testid={loadingKey} />
        {fieldsToRender?.map(fieldToRender => {
          const { fieldName, softHidden } = fieldToRender;
          const fieldState = formState?.fieldStates[fieldName];
          if (!fieldState) return <React.Fragment key={fieldName} />;

          const fieldConfig = fields![fieldName];
          return (
            <FormErrorBoundary key={`${fieldName}-${entityId}-form`}>
              <RenderField
                fieldName={fieldName}
                entityId={entityId}
                entityType={entityType}
                programName={programName}
                type={fieldState.type ?? ""}
                hidden={fieldState.hidden}
                required={fieldState.required}
                readOnly={fieldState.readOnly}
                options={fieldState.options}
                validate={fieldState.validate}
                parentEntityId={parentEntityId}
                parentEntityType={parentEntityType}
                setFieldValue={setFieldValue}
                isManualSave={isManualSave}
                isCreate={isCreate}
                filterText={filterText}
                softHidden={softHidden}
                label={fieldConfig?.label}
                skipLayoutReadOnly={fieldConfig?.skipLayoutReadOnly}
                hideOnCreate={fieldConfig?.hideOnCreate}
                config={fieldConfig?.config}
                description={fieldConfig?.description}
                placeholder={fieldConfig?.placeholder}
                helpText={fieldConfig?.helpText}
                renderLabel={renderLabel}
                renderError={renderError}
                renderStatus={renderStatus}
              />
            </FormErrorBoundary>
          );
        })}
      </form>
    </div>
  );
};

