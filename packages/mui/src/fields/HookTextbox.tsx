import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { TextField } from "@mui/material";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookTextboxProps {
  ellipsifyTextCharacters?: number;
  placeHolder?: string;
  multiline?: boolean;
}

const HookTextbox = (props: IFieldProps<IHookTextboxProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, setFieldValue } = props;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(fieldName, event.target.value, false, 3000);
  };

  return readOnly ? (
    <ReadOnlyText
      fieldName={fieldName}
      value={value as string}
      ellipsifyTextCharacters={config?.ellipsifyTextCharacters}
    />
  ) : (
    <TextField
      className={FieldClassName("hook-textbox", error)}
      autoComplete="off"
      value={(value as string) ?? ""}
      onChange={onChange}
      size="small"
      fullWidth
      error={!!error}
      helperText={error?.message}
      inputProps={{
        "data-testid": GetFieldDataTestId(fieldName, programName, entityType, entityId),
      }}
    />
  );
};

export default HookTextbox;
