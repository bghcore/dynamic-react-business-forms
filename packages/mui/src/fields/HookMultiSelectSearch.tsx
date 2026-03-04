import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Autocomplete, TextField, Chip, Box } from "@mui/material";
import React from "react";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

const HookMultiSelectSearch = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, options: dropdownOptions, setFieldValue } = props;

  const selectedValues = (value as string[]) ?? [];

  const mappedOptions = dropdownOptions?.map(o => ({
    value: String(o.value),
    label: o.label,
    disabled: !!o.disabled,
  })) ?? [];

  const onChange = (_: unknown, newValue: { value: string; label: string; disabled: boolean }[]) => {
    setFieldValue(fieldName, newValue.map(v => v.value), false, 3000);
  };

  return readOnly ? (
    <>
      {value && (value as string[]).length > 0 ? (
        <Box className="hook-multi-select-search-read-only" sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {(value as string[]).map(v => (
            <Chip key={v} label={v} size="small" />
          ))}
        </Box>
      ) : null}
    </>
  ) : (
    <Autocomplete
      className={FieldClassName("hook-multi-select-search", error)}
      multiple
      freeSolo
      options={mappedOptions}
      getOptionLabel={(option) => typeof option === "string" ? option : option.label}
      getOptionDisabled={(option) => typeof option === "string" ? false : !!option.disabled}
      value={mappedOptions.filter(o => selectedValues.includes(o.value))}
      onChange={onChange}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            size="small"
            label={typeof option === "string" ? option : option.label}
            {...getTagProps({ index })}
            key={typeof option === "string" ? option : option.value}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          error={!!error}
          helperText={error?.message}
          inputProps={{
            ...params.inputProps,
            "data-testid": GetFieldDataTestId(fieldName, programName, entityType, entityId),
          }}
        />
      )}
    />
  );
};

export default HookMultiSelectSearch;
