import { Dictionary } from "../utils";
import React from "react";
import { useFormContext } from "react-hook-form";
import { IFieldConfig } from "../types/IFieldConfig";
import { UseBusinessRulesContext } from "../providers/BusinessRulesProvider";
import { HookInlineFormStrings } from "../strings";
import HookRenderField from "./HookRenderField";

interface IHookConfirmInputsModalProps {
  isOpen?: boolean;
  configName: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  fieldConfigs: Dictionary<IFieldConfig>;
  confirmInputFields: string[];
  saveConfirmInputFields: () => void;
  cancelConfirmInputFields: () => void;
  /** Optional custom dialog renderer. If not provided, uses native <dialog>. */
  renderDialog?: (props: { isOpen: boolean; onSave: () => void; onCancel: () => void; children: React.ReactNode }) => JSX.Element;
}

const HookConfirmInputsModal = (props: IHookConfirmInputsModalProps) => {
  const {
    isOpen,
    configName,
    entityId,
    entityType,
    programName,
    fieldConfigs,
    confirmInputFields,
    saveConfirmInputFields,
    cancelConfirmInputFields,
    renderDialog
  } = props;
  const { setValue, trigger } = useFormContext();
  const { businessRules } = UseBusinessRulesContext();

  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const setValueFunctionFieldValue = (fieldName: string, fieldValue: unknown) => {
    trigger();
    setValue(`${fieldName}` as const, fieldValue, { shouldDirty: true });
  };

  const content = (
    <div className="hook-inline-form-wrapper">
      <div className="hook-inline-form-container">
        <form className="hook-inline-form modal">
          {confirmInputFields ? (
            confirmInputFields.map(confirmInputField => {
              const { component, dropdownOptions, validations } = businessRules.configRules[configName].fieldRules[
                confirmInputField
              ];
              const fieldConfig = fieldConfigs[confirmInputField];
              const { label, hideOnCreate, meta } = fieldConfig;
              return (
                <HookRenderField
                  key={`${confirmInputField}-${entityId}-modal`}
                  fieldName={confirmInputField}
                  entityId={entityId}
                  entityType={entityType}
                  programName={programName}
                  component={component}
                  required
                  dropdownOptions={dropdownOptions}
                  validations={validations}
                  isManualSave
                  setFieldValue={setValueFunctionFieldValue}
                  label={label}
                  skipLayoutReadOnly
                  hideOnCreate={hideOnCreate}
                  meta={meta}
                />
              );
            })
          ) : (
            <></>
          )}
        </form>
      </div>
    </div>
  );

  if (renderDialog) {
    return renderDialog({ isOpen: !!isOpen, onSave: saveConfirmInputFields, onCancel: cancelConfirmInputFields, children: content });
  }

  return (
    <dialog ref={dialogRef} className="hook-inline-form-modal">
      {content}
      <div className="hook-inline-form-modal-actions">
        <button onClick={saveConfirmInputFields}>{HookInlineFormStrings.save}</button>
        <button onClick={cancelConfirmInputFields}>{HookInlineFormStrings.cancel}</button>
      </div>
    </dialog>
  );
};

export default HookConfirmInputsModal;
