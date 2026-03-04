import { IFieldProps, isNull } from "@bghcore/dynamic-forms-core";
import { TextField } from "@mui/material";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

const HookNumber = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, setFieldValue } = props;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const number = Number(event.target.value);
    if (!isNaN(number)) {
      setFieldValue(fieldName, number, false, 1500);
    }
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={String(value)} />
  ) : (
    <TextField
      className={FieldClassName("hook-number", error)}
      autoComplete="off"
      type="number"
      value={!isNull(value) ? String(value) : ""}
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

export default HookNumber;
