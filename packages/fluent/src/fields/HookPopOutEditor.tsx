import { IFieldProps, FormStrings } from "@bghcore/dynamic-forms-core";
import { Button, Textarea, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions } from "@fluentui/react-components";
import { FullScreenMaximizeRegular, DismissRegular } from "@fluentui/react-icons";
import React, { useState } from "react";
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
  renderExtraModalFooter?: () => React.ReactNode;
}

const HookPopOutEditor = (props: IFieldProps<IHookPopOutEditorProps>) => {
  const {
    error, fieldName, programName, entityType, entityId, config, readOnly,
    required, savePending, saving, value, label, setFieldValue
  } = props;

  const [modalValue, setModalValue] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    modalVisible ? setModalValue(newValue) : setFieldValue(fieldName, newValue, false, 3000);
  };

  const onExpandButtonClick = () => {
    setModalVisible(true);
    setModalValue(value ? `${value}` : "");
  };

  const onSaveButtonClick = () => {
    setFieldValue(fieldName, modalValue, false);
    setDialogVisible(false);
    setModalVisible(false);
    config?.saveCallback?.();
  };

  const onCancelButtonClick = () => {
    if (dialogVisible) {
      setDialogVisible(false);
      setModalVisible(false);
    } else if (modalValue !== value) {
      setDialogVisible(true);
    } else {
      setModalVisible(false);
    }
  };

  if (readOnly) {
    return (
      <ReadOnlyText
        fieldName={fieldName}
        value={value ? `${value}` : ""}
        ellipsifyTextCharacters={config?.ellipsifyTextCharacters}
      />
    );
  }

  return (
    <>
      <div className="hook-textarea">
        <Textarea
          className={FieldClassName("hook-text-area", error)}
          resize="none"
          autoComplete="off"
          value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
          onChange={onChange}
          data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
          rows={config?.numberOfRows ?? 4}
        />
        <Button
          className="expand-button"
          appearance="secondary"
          icon={<FullScreenMaximizeRegular />}
          onClick={onExpandButtonClick}
          aria-label={FormStrings.openExpandedTextEditor}
        >
          {FormStrings.expand}
        </Button>
      </div>

      <Dialog open={modalVisible} onOpenChange={(_, data) => { if (!data.open) onCancelButtonClick(); }}>
        <DialogSurface className="hook-expanded-textarea" style={{ maxWidth: "90vw", width: "800px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<DismissRegular />} onClick={onCancelButtonClick}
                  aria-label={FormStrings.closeExpandedTextEditor} />
              }
            >
              {label}{required && <span className="required-indicator"> *</span>}
            </DialogTitle>
            <DialogContent>
              <Textarea
                className={FieldClassName("hook-text-area", error)}
                resize="vertical"
                autoComplete="off"
                value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
                onChange={onChange}
                rows={12}
                style={{ width: "100%" }}
              />
            </DialogContent>
            <DialogActions>
              {config?.renderExtraModalFooter && <div className="custom-footer">{config.renderExtraModalFooter()}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {(savePending || saving) && (
                  <StatusMessage savePending={!error ? savePending : undefined} saving={saving} error={error} />
                )}
              </div>
              <Button appearance="secondary" onClick={onCancelButtonClick}>{FormStrings.cancel}</Button>
              <Button appearance="primary" onClick={onSaveButtonClick}
                disabled={!config?.saveCallback && modalValue === (value as string)}
                data-testid={`${programName}-${entityType}-${entityId}-save-note`}>
                {config?.saveCallback ? FormStrings.save : FormStrings.save}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={dialogVisible} onOpenChange={(_, data) => { if (!data.open) setDialogVisible(false); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{FormStrings.unsavedChanges}</DialogTitle>
            <DialogContent>{FormStrings.saveChangesTo(label)}</DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onCancelButtonClick}>{FormStrings.dontSave}</Button>
              <Button appearance="primary" onClick={onSaveButtonClick}>{FormStrings.save}</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default HookPopOutEditor;
