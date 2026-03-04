import { IFieldProps } from "@bghcore/dynamic-forms-core";
import { Dropdown, Option } from "@fluentui/react-components";
import type { OptionOnSelectData } from "@fluentui/react-components";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId } from "../helpers";

interface IHookDropdownProps {
  placeHolder?: string;
  setDefaultKeyIfOnlyOneOption?: boolean;
}

const HookDropdown = (props: IFieldProps<IHookDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, config, error, options, setFieldValue } = props;

  const onOptionSelect = (_: unknown, data: OptionOnSelectData) => {
    setFieldValue(fieldName, data.optionValue);
  };

  React.useEffect(() => {
    if (!value && !readOnly && config?.setDefaultKeyIfOnlyOneOption && options?.length === 1) {
      setFieldValue(fieldName, String(options[0].value));
    }
  }, [options]);

  const selectedText = options?.find(o => String(o.value) === String(value))?.label;

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={value as string} />
  ) : (
    <Dropdown
      className={FieldClassName("hook-dropdown", error)}
      value={selectedText ?? ""}
      selectedOptions={value ? [String(value)] : []}
      onOptionSelect={onOptionSelect}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
    >
      {options?.map(option => (
        <Option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
          {option.label}
        </Option>
      ))}
    </Dropdown>
  );
};

export default HookDropdown;
