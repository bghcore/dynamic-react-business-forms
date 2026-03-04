import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Combobox, Option } from "@fluentui/react-components";
import type { ComboboxProps } from "@fluentui/react-components";
import React from "react";
import { Dropdown } from "@fluentui/react-components";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

const HookMultiSelectSearch = (props: IFieldProps<{}>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, error, options, setFieldValue } = props;

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
    setFieldValue(fieldName, data.selectedOptions, false, 3000);
  };

  return readOnly ? (
    <>
      {value && (value as string[]).length > 0 ? (
        <Dropdown
          className="hook-multi-select-search-read-only"
          multiselect
          value={(value as string[]).join(", ")}
          selectedOptions={value as string[]}
        >
          {(value as string[]).map(v => (
            <Option key={v} value={v}>{v}</Option>
          ))}
        </Dropdown>
      ) : null}
    </>
  ) : (
    <Combobox
      className={FieldClassName("hook-multi-select-search", error)}
      multiselect
      freeform
      value={undefined}
      selectedOptions={(value as string[]) ?? []}
      onOptionSelect={onOptionSelect}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
    >
      {options?.map(option => (
        <Option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </Option>
      ))}
    </Combobox>
  );
};

export default HookMultiSelectSearch;
