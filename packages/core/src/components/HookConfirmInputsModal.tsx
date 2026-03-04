import React from "react";
import { useFormContext } from "react-hook-form";
import { IFieldConfig } from "../types/IFieldConfig";
import { UseRulesEngineContext } from "../providers/BusinessRulesProvider";
import { FormStrings } from "../strings";
import RenderField from "./HookRenderField";

interface IConfirmInputsModalProps {
  isOpen?: boolean;
  configName: string;
  entityId?: string;
  entityType?: string;
  programName?: string;
  fields: Record<string, IFieldConfig>;
  confirmInputFields: string[];
  saveConfirmInputFields: () => void;
  cancelConfirmInputFields: () => void;
  renderDialog?: (props: { isOpen: boolean; onSave: () => void; onCancel: () => void; children: React.ReactNode }) => React.JSX.Element;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

const ConfirmInputsModal = (props: IConfirmInputsModalProps) => {
  const {
    isOpen, configName, entityId, entityType, programName,
    fields, confirmInputFields, saveConfirmInputFields,
    cancelConfirmInputFields, renderDialog,
  } = props;

  const { setValue, trigger } = useFormContext();
  const { rulesState } = UseRulesEngineContext();

  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = React.useRef<Element | null>(null);
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      previouslyFocusedRef.current = document.activeElement;
      dialogRef.current.showModal();
      saveButtonRef.current?.focus();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current.close();
      if (previouslyFocusedRef.current instanceof HTMLElement) previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => { e.preventDefault(); cancelConfirmInputFields(); };
    dialog.addEventListener("cancel", handleCancel);
    return () => { dialog.removeEventListener("cancel", handleCancel); };
  }, [cancelConfirmInputFields]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusableElements = getFocusableElements(dialogRef.current);
    if (focusableElements.length === 0) return;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  const setValueFunctionFieldValue = (fieldName: string, fieldValue: unknown) => {
    trigger();
    setValue(`${fieldName}` as const, fieldValue, { shouldDirty: true });
  };

  const content = (
    <div className="dynamic-form-wrapper">
      <div className="dynamic-form-container">
        <form className="dynamic-form modal">
          {confirmInputFields?.map(confirmInputField => {
            const fieldState = rulesState.configs[configName]?.fieldStates[confirmInputField];
            const fieldConfig = fields[confirmInputField];
            if (!fieldState || !fieldConfig) return null;
            return (
              <RenderField
                key={`${confirmInputField}-${entityId}-modal`}
                fieldName={confirmInputField}
                entityId={entityId}
                entityType={entityType}
                programName={programName}
                type={fieldState.type ?? ""}
                required
                options={fieldState.options}
                validate={fieldState.validate}
                isManualSave
                setFieldValue={setValueFunctionFieldValue}
                label={fieldConfig.label}
                skipLayoutReadOnly
                hideOnCreate={fieldConfig.hideOnCreate}
                config={fieldConfig.config}
              />
            );
          })}
        </form>
      </div>
    </div>
  );

  if (renderDialog) {
    return renderDialog({ isOpen: !!isOpen, onSave: saveConfirmInputFields, onCancel: cancelConfirmInputFields, children: content });
  }

  return (
    <dialog ref={dialogRef} className="dynamic-form-modal" aria-label={FormStrings.confirm} onKeyDown={handleKeyDown}>
      {content}
      <div className="dynamic-form-modal-actions">
        <button ref={saveButtonRef} onClick={saveConfirmInputFields}>{FormStrings.save}</button>
        <button onClick={cancelConfirmInputFields}>{FormStrings.cancel}</button>
      </div>
    </dialog>
  );
};

export default ConfirmInputsModal;
