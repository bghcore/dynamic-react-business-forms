import { IHookFieldSharedProps, buildDropdownOption, getDropdownValue } from "@brhanso/dynamic-forms-core";
import { Dropdown, IDropdownOption, IDropdownProps } from "@fluentui/react";
import React from "react";
import { ReadOnlyText } from "../components/ReadOnlyText";
import { FieldClassName, GetFieldDataTestId, onRenderDropdownItemWithIcon } from "../helpers";

interface IHookDropdownProps extends IDropdownProps {
  dropdownOptions?: string[];
  placeHolder?: string;
}

const HookSimpleDropdown = (props: IHookFieldSharedProps<IHookDropdownProps>) => {
  const { fieldName, programName, entityType, entityId, value, readOnly, meta, error, setFieldValue } = props;

  const [dropdownOptions, setDropdownOptions] = React.useState<IDropdownOption[]>([]);

  React.useEffect(() => {
    if (meta?.dropdownOptions) {
      setDropdownOptions((meta.dropdownOptions as string[])?.map(option => buildDropdownOption(option)));
    }
  }, [meta]);

  const onChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    setFieldValue(fieldName, getDropdownValue(option));
  };

  return readOnly ? (
    <ReadOnlyText fieldName={fieldName} value={value as string} />
  ) : (
    <Dropdown
      className={FieldClassName("hook-dropdown", error)}
      options={dropdownOptions}
      onChange={onChange}
      selectedKey={`${value}`}
      onRenderOption={onRenderDropdownItemWithIcon}
      calloutProps={{ className: "hook-dropdown-callout" }}
      data-testid={GetFieldDataTestId(fieldName, programName, entityType, entityId)}
      {...meta}
    />
  );
};

export default HookSimpleDropdown;
