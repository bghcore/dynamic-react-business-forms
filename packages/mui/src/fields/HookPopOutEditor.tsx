import { IFieldProps, FormStrings } from "@bghcore/dynamic-forms-core";
import {
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
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
        <TextField
          className={FieldClassName("hook-text-area", error)}
          autoComplete="off"
          multiline
          rows={config?.numberOfRows ?? 4}
          value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
          onChange={onChange}
          size="small"
          fullWidth
          error={!!error}
          helperText={error?.message}
          inputProps={{
            "data-testid": GetFieldDataTestId(fieldName, programName, entityType, entityId),
          }}
        />
        <Button
          className="expand-button"
          variant="outlined"
          size="small"
          onClick={onExpandButtonClick}
          aria-label={FormStrings.openExpandedTextEditor}
          sx={{ mt: 1 }}
        >
          {FormStrings.expand}
        </Button>
      </div>

      <Dialog
        open={modalVisible}
        onClose={onCancelButtonClick}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {label}{required && <span className="required-indicator"> *</span>}
          </span>
          <IconButton
            size="small"
            onClick={onCancelButtonClick}
            aria-label={FormStrings.closeExpandedTextEditor}
          >
            &#10005;
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            className={FieldClassName("hook-text-area", error)}
            autoComplete="off"
            multiline
            rows={12}
            value={modalVisible ? `${modalValue}` : value ? `${value}` : ""}
            onChange={onChange}
            fullWidth
            error={!!error}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          {config?.renderExtraModalFooter && <div className="custom-footer">{config.renderExtraModalFooter()}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {(savePending || saving) && (
              <StatusMessage savePending={!error ? savePending : undefined} saving={saving} error={error} />
            )}
          </div>
          <Button variant="outlined" onClick={onCancelButtonClick}>{FormStrings.cancel}</Button>
          <Button
            variant="contained"
            onClick={onSaveButtonClick}
            disabled={!config?.saveCallback && modalValue === (value as string)}
            data-testid={`${programName}-${entityType}-${entityId}-save-note`}
          >
            {FormStrings.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogVisible} onClose={() => setDialogVisible(false)}>
        <DialogTitle>{FormStrings.unsavedChanges}</DialogTitle>
        <DialogContent>{FormStrings.saveChangesTo(label)}</DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onCancelButtonClick}>{FormStrings.dontSave}</Button>
          <Button variant="contained" onClick={onSaveButtonClick}>{FormStrings.save}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HookPopOutEditor;
