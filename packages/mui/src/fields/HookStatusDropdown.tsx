import { IFieldProps, Dictionary } from "@bghcore/dynamic-forms-core";
import { FormControl, Select, MenuItem, Chip } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

export interface IHookStatusDropdownProps {
  placeHolder?: string;
  statusColors?: Dictionary<string>;
}

const StatusDot = ({ color }: { color?: string }) => (
  <span
    className="status-color"
    style={{
      display: "inline-block",
      backgroundColor: color || "transparent",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      flexShrink: 0,
      marginRight: "8px",
    }}
  />
);

const HookStatusDropdown = (props: IFieldProps<IHookStatusDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, config, options, setFieldValue } = props;

  const statusColors = (config?.statusColors ?? {}) as Dictionary<string>;

  const onChange = (event: SelectChangeEvent<string>) => {
    setFieldValue(fieldName, event.target.value);
  };

  return readOnly ? (
    <div className="hook-read-only-status-dropdown" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StatusDot color={statusColors && value ? statusColors[value as string] : undefined} />
      <ReadOnlyText fieldName={fieldName} value={value as string} />
    </div>
  ) : (
    <div className={FieldClassName("hook-status-dropdown", error)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <StatusDot color={statusColors && value ? statusColors[value as string] : undefined} />
      <FormControl fullWidth size="small" error={!!error}>
        <Select
          value={value ? String(value) : ""}
          onChange={onChange}
          displayEmpty
          data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
          renderValue={(selected) => {
            const option = options?.find(o => String(o.value) === selected);
            return option?.label ?? "";
          }}
        >
          {options?.map(option => (
            <MenuItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
              <StatusDot color={statusColors[String(option.value)]} />
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default HookStatusDropdown;
