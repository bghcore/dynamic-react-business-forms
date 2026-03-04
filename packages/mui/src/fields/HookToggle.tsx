import { IFieldProps, convertBooleanToYesOrNoText } from "@bghcore/dynamic-forms-core";
import { Switch, FormControlLabel } from "@mui/material";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { GetFieldDataTestId } from "../helpers";

const HookToggle = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, setFieldValue } = props;

  const onChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setFieldValue(fieldName, checked);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={convertBooleanToYesOrNoText(value as boolean)} />
  ) : (
    <FormControlLabel
      className="hook-toggle"
      control={
        <Switch
          checked={value as boolean}
          onChange={onChange}
          data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
        />
      }
      label=""
    />
  );
};

export default HookToggle;
