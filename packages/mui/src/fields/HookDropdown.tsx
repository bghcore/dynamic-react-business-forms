import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { FormControl, Select, MenuItem } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookDropdownProps {
  placeHolder?: string;
  setDefaultKeyIfOnlyOneOption?: boolean;
}

const HookDropdown = (props: IFieldProps<IHookDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, options, setFieldValue } = props;

  const onChange = (event: SelectChangeEvent<string>) => {
    setFieldValue(fieldName, event.target.value);
  };

  React.useEffect(() => {
    if (!value && !readOnly && config?.setDefaultKeyIfOnlyOneOption && options?.length === 1) {
      setFieldValue(fieldName, String(options[0].value));
    }
  }, [options]);

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={value as string} />
  ) : (
    <FormControl fullWidth size="small" error={!!error}>
      <Select
        className={FieldClassName("hook-dropdown", error)}
        value={value ? String(value) : ""}
        onChange={onChange}
        displayEmpty
        data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      >
        {options?.map(option => (
          <MenuItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default HookDropdown;
