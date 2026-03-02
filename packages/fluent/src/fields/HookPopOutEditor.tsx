import { IHookFieldSharedProps, HookInlineFormStrings } from "@brhanso/dynamic-forms-core";
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  IconButton,
  Modal,
  PrimaryButton,
  Stack,
  TextField
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useState } from "react";
import { FieldError } from "react-hook-form";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { StatusMessage } from "../components/StatusMessage";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookPopOutEditorProps {
  autoAdjustHeight?: boolean;
  numberOfRows?: number;
  ellipsifyTextCharacters?: number;
  additionalInfo?: string;
  maxLimit?: number;
  saveCallback?: () => void;
  renderExtraModalFooter?: () => JSX.Element;
}

const HookPopOutEditor = (props: IHookFieldSharedProps<IHookPopOutEditorProps>) => {
  const {
    error,
    fieldName,
    programName,
    entityType,
    entityId,
    meta,
    readOnly,
    required,
    savePending,
    saving,
    value,
    label,
    setFieldValue
  } = props;

  const {
    openExpandedTextEditor: openExpandedEditor,
    closeExpandedTextEditor,
    unsavedChanges,
    save,
    dontSave,
    expand,
    saveChangesTo,
    returnToEditing
  } = HookInlineFormStrings;

  const [modalValue, setModalValue] = useState<string>();
  const [modalVisible, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);
  const [dialogVisible, { setTrue: showDialog, setFalse: hideDialog }] = useBoolean(false);
  const [key, setKey] = useState(0);

  const onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    modalVisible ? setModalValue(newValue) : setFieldValue(fieldName, newValue, false, 3000);
  };

  const onExpandButtonClick = () => {
    showModal();
    setModalValue(value ? `${value}` : "");
  };

  const onSaveButtonClick = () => {
    setFieldValue(fieldName, modalValue, false);
    if (dialogVisible || modalVisible) {
      setKey(key + 1);
      hideDialog();
      hideModal();
    }
    meta?.saveCallback?.();
  };

  const onCancelButtonClick = () => {
    if (dialogVisible) {
      hideDialog();
      hideModal();
    } else if (modalValue !== value) {
      showDialog();
    } else {
      hideModal();
    }
  };

  if (readOnly) {
    return (
      <ReadOnlyText
        fieldName={fieldName}
        value={value ? `${value}` : ""}
        ellipsifyTextCharacters={meta?.ellipsifyTextCharacters}
      />
    );
  }

  return (
    <>
      <div className="hook-textarea">
        <TextField
          key={key}
          onChange={onChange}
          className={FieldClassName("hook-text-area", error)}
          resizable={false}
          multiline
          autoComplete="off"
          value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
          data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
          {...meta}
        />
        <DefaultButton
          className="expand-button"
          iconProps={{ iconName: "FullScreen" }}
          onClick={onExpandButtonClick}
          ariaLabel={openExpandedEditor}
          text={expand}
          data-testid={`${GetFieldDataTestId(fieldName, programName, entityType, entityId)}-expand-input`}
        />
      </div>
      <Modal
        isOpen={modalVisible}
        isBlocking={false}
        containerClassName="hook-expanded-textarea"
        onDismiss={onCancelButtonClick}
      >
        <Stack className="header-stack">
          <div className="modal-header">
            <label className="modal-title">
              {label}
              {required && <span className="required-indicator"> *</span>}
            </label>
            <IconButton
              className="icon-button"
              iconProps={{ iconName: "Cancel" }}
              onClick={onCancelButtonClick}
              ariaLabel={closeExpandedTextEditor}
            />
          </div>
        </Stack>
        <hr />
        <div className="modal-body">
          <TextField
            onChange={onChange}
            className={FieldClassName("hook-text-area", error)}
            resizable={false}
            multiline
            autoComplete="off"
            value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
          />
        </div>
        <hr />
        <div className="modal-footer">
          {meta?.renderExtraModalFooter && <div className="custom-footer">{meta.renderExtraModalFooter()}</div>}
          <div className="modal-footer-primary">
            <div className="modal-footer-messages">
              {savePending || saving ? (
                <StatusMessage
                  savePending={!error ? savePending : undefined}
                  saving={saving}
                  error={error}
                />
              ) : null}
            </div>
            <div className="modal-footer-actions">
              <DefaultButton text={HookInlineFormStrings.cancel} onClick={onCancelButtonClick} />
              <PrimaryButton
                text={meta?.saveCallback ? save : HookInlineFormStrings.save}
                disabled={!meta?.saveCallback && modalValue === value}
                onClick={onSaveButtonClick}
                data-testid={`${programName}-${entityType}-${entityId}-save-note`}
              />
            </div>
          </div>
        </div>
      </Modal>
      <Dialog
        hidden={!dialogVisible}
        onDismiss={hideDialog}
        dialogContentProps={{
          type: DialogType.normal,
          showCloseButton: true,
          title: unsavedChanges,
          closeButtonAriaLabel: returnToEditing,
          subText: saveChangesTo(label)
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton onClick={onSaveButtonClick} text={save} />
          <DefaultButton onClick={onCancelButtonClick} text={dontSave} />
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default HookPopOutEditor;
