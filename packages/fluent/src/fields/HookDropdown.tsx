import { IHookFieldSharedProps, getDropdownValue } from "@brhanso/dynamic-forms-core";
import { Dropdown, IDropdownOption, IDropdownProps } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId, onRenderDropdownItemWithIcon } from "../helpers";

interface IHookDropdownProps extends IDropdownProps {
  placeHolder?: string;
  setDefaultKeyIfOnlyOneOption?: boolean;
}

const HookDropdown = (props: IHookFieldSharedProps<IHookDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, dropdownOptions, setFieldValue } = props;

  const onChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    setFieldValue(fieldName, getDropdownValue(option));
  };

  React.useEffect(() => {
    if (!value && !readOnly && meta?.setDefaultKeyIfOnlyOneOption && dropdownOptions?.length === 1) {
      setFieldValue(fieldName, getDropdownValue(dropdownOptions[0] as IDropdownOption));
    }
  }, [dropdownOptions]);

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={value as string} />
  ) : (
    <Dropdown
      className={FieldClassName("hook-dropdown", error)}
      options={dropdownOptions as IDropdownOption[]}
      onChange={onChange}
      selectedKey={!!value ? `${value}` : undefined}
      onRenderOption={onRenderDropdownItemWithIcon}
      calloutProps={{ className: "hook-dropdown-callout" }}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookDropdown;
