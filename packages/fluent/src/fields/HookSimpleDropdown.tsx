import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Dropdown, Option } from "@fluentui/react-components";
import type { OptionOnSelectData } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookSimpleDropdownProps {
  dropdownOptions?: string[];
  placeHolder?: string;
}

const HookSimpleDropdown = (props: IFieldProps<IHookSimpleDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, setFieldValue } = props;

  const simpleOptions = config?.dropdownOptions ?? [];

  const onOptionSelect = (_: unknown, data: OptionOnSelectData) => {
    setFieldValue(fieldName, data.optionValue);
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={value as string} />
  ) : (
    <Dropdown
      className={FieldClassName("hook-dropdown", error)}
      value={(value as string) ?? ""}
      selectedOptions={value ? [String(value)] : []}
      onOptionSelect={onOptionSelect}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
    >
      {simpleOptions.map(option => (
        <Option key={option} value={option}>{option}</Option>
      ))}
    </Dropdown>
  );
};

export default HookSimpleDropdown;
